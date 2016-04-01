'use strict';

module.exports = function(S) {

  const path    = require('path'),
    fs          = require('fs'),
    fse         = require('fs-extra'),
    webpack     = require('webpack'),
    BbPromise   = require('bluebird'),
    chalk       = require('chalk'),
    _           = require('lodash');

  const natives = process.binding('natives');

  const getStats = function(filePath) {
    try {
      return fs.lstatSync(filePath);
    }
    catch (e) {}
  };

  class ServerlessWebpack extends S.classes.Plugin {

    constructor() {
      super();
    }

    static getName() {
      return 'com.serverless.' + ServerlessWebpack.name;
    }

    registerHooks() {
      S.addHook(this._optimize.bind(this), {
        action: 'codeDeployLambda',
        event: 'pre'
      });
      return BbPromise.resolve();
    }

    _optimize(evt) {
      // Validate: Check Serverless version
      // TODO: Use a full x.x.x version string. Consider using semver: https://github.com/npm/node-semver
      if(parseInt(S._version.split('.')[1]) < 5)
        console.log('WARNING: This version of the Serverless Webpack Plugin will not work with a version of Serverless that is less than v0.5');

      let project = S.getProject();
      let func    = S.getProject().getFunction(evt.options.name);

      let projectConf = project.custom && project.custom.webpack;
      let funcConf = func.custom && func.custom.webpack;

      if(func.getRuntime().getName() === 'nodejs' && projectConf && (funcConf || (projectConf.global && funcConf !== false))) {
        let optimizer = new WebpackNodejs(S, evt, func);
        return optimizer.optimize();
      }

      return BbPromise.resolve(evt);
    }

  }

  class WebpackNodejs {

    constructor(S, evt, func) {
      this.evt = evt;
      this.function = func;
    }

    optimize() {
      let _this = this;
      return _this.webpack()
        .then(function() {
          return _this.evt;
        });
    }

    webpack() {
      let _this = this;
      const configPath = S.getProject().custom.webpack.config;
      let webpackConfig = require(path.join(S.config.projectPath, configPath));
      const handlerFileName = _this.function.getHandler().split('.')[0] + '.js';
      const optimizedDistPath = path.join(_this.evt.options.pathDist, 'optimized');

      try {
        let funcConf = require(path.join(_this.evt.options.pathDist, configPath.split('/').pop()));
        webpackConfig = _.mergeWith(webpackConfig, funcConf, function(obj, src) {
          if(_.isArray(obj))
            return obj.concat(src);
        });
      }
      catch (e) {}

      fse.mkdirpSync(optimizedDistPath);
      fs.chmodSync(optimizedDistPath, parseInt('777', 8));

      webpackConfig.context = _this.evt.options.pathDist;
      webpackConfig.entry = './' + handlerFileName;
      webpackConfig.output = {
        libraryTarget: 'commonjs',
        path: optimizedDistPath,
        filename: handlerFileName
      };

      return new BbPromise(function(resolve, reject) {
        webpack(webpackConfig, function(err, stats) {
          if(err)
            return reject(err);
          resolve(stats);
        });
      })
      .then(function(stats) {
        console.log(stats.toString({
          colors: true,
          hash: false,
          version: false,
          chunks: false,
          children: false
        }));
        return stats.toJson({
          hash: false,
          version: false,
          timings: false,
          assets: false,
          chunks: false,
          modules: true,
          reasons: false,
          children: false,
          source: false,
          errors: false,
          errorDetails: false,
          warnings: false,
          publicPath: false,
          exclude: [ /^(?!external )/ ]
        }).modules.map(function(module) {
          return /external "(.+)"/.exec(module.identifier)[1];
        })
        .filter(function(name) {
          return name !== 'aws-sdk' && !natives[name];
        });
      })
      .then(function(modules) {
        modules.forEach(function(module) {
          let filePath = path.resolve(path.join(S.config.projectPath, 'node_modules', module));
          let stats = getStats(filePath);
          if(!stats) {
            filePath = path.resolve(path.join(_this.evt.options.pathDist, 'node_modules', module));
            stats = getStats(filePath);
          }
          if(!stats)
            console.log(chalk.red.bold('unable to copy external module: %s'), module);
          else
            fse.copySync(filePath, path.join(optimizedDistPath, module));
        });
        _this.evt.options.pathDist = optimizedDistPath;
      });
    }

  }

  return ServerlessWebpack;
};
