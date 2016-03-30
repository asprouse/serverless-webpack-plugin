'use strict';

module.exports = function(S) {

  const path    = require('path'),
    fs          = require('fs'),
    webpack     = require('webpack'),
    wrench      = require('wrench'),
    BbPromise   = require('bluebird');

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
      const webpackConfig = require(path.join(S.config.projectPath, S.getProject().custom.webpack.config));
      const handlerFileName = _this.function.getHandler().split('.')[0] + '.js';
      const optimizedDistPath = path.join(_this.evt.options.pathDist, 'optimized');

      wrench.mkdirSyncRecursive(optimizedDistPath, '0777');

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
        _this.evt.options.pathDist = optimizedDistPath;
      });
    }

  }

  return ServerlessWebpack;
};
