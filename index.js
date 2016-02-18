'use strict';

/**
 * Serverless Optimizer Plugin
 */

function getHandlerDirectoryPath(handler) {
  return handler.substr(0, handler.lastIndexOf('/') + 1);
}

module.exports = function(ServerlessPlugin) {

  const path    = require('path'),
    _           = require('lodash'),
    fs          = require('fs'),
    webpack  = require('webpack'),
    wrench      = require('wrench'),
    Promise   = require('bluebird');

  /**
   * ServerlessOptimizer
   */

  class ServerlessOptimizer extends ServerlessPlugin {

    /**
     * Constructor
     */

    constructor(S) {
      super(S);
    }

    /**
     * Define your plugins name
     */

    static getName() {
      return 'com.serverless.' + ServerlessOptimizer.name;
    }

    /**
     * Register Hooks
     */

    registerHooks() {

      this.S.addHook(this._optimize.bind(this), {
        action: 'codePackageLambda',
        event: 'post'
      });

      return Promise.resolve();
    }

    /**
     * Optimize
     */

    _optimize(evt) {

      // Validate: Check Serverless version
      if (parseInt(this.S._version.split('.')[1]) < 2) {
        console.log("WARNING: This version of the Serverless Optimizer Plugin will not work with a version of Serverless that is less than v0.2.");
      }

      // Get function
      let func    = this.S.state.getFunctions({  paths: [evt.options.path] })[0],
        component = func.getComponent(),
        optimizer;

      // Skip if no optimization is set on component OR function
      if ((!component.custom || !component.custom.optimize) && (!func.custom || !func.custom.optimize)) {
        return Promise.resolve(evt);
      }

      // If optimize is set in component, but false in function, skip
      if (component.custom && component.custom.optimize && func.custom && func.custom.optimize === false) {
        return Promise.resolve(evt);
      }

      // Optimize: Nodejs
      if (component.runtime === 'nodejs') {
        optimizer = new OptimizeNodejs(this.S, evt, component, func);
        return optimizer.optimize()
          .then(function(evt) {
            return evt;
          });
      }

      // Otherwise, skip plugin
      return Promise.resolve(evt);
    }
  }

  /**
   * Optimize Nodejs
   * - Separate class allows this Hook to be run concurrently safely.
   */

  class OptimizeNodejs {

    constructor(S, evt, component, func) {
      this.S          = S;
      this.evt        = evt;
      this.component  = component;
      this.function   = func;
    }

    optimize() {

      let _this = this;

      const projectPath = this.S.config.projectPath;

      _this.config = {
        handlerExt:   'js',
        webpackConfigPath: ''
      };
      _this.config = _.merge(
        _this.config,
        _this.component.custom.optimize ? _this.component.custom.optimize === true ? {} : _this.component.custom.optimize : {},
        _this.function.custom.optimize ? _this.function.custom.optimize === true ? {} : _this.function.custom.optimize : {}
      );


      try {
        this.config.webpackConfig = require(path.join(projectPath, this.config.webpackConfigPath));
        return _this.bundle()
          .then(function() {
            return _this.evt;
          });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    bundle() {
      let _this = this;

      const webpackConfig = _this.config.webpackConfig;
      const bundledFilename = 'bundled.js';
      const handlerDirectory = getHandlerDirectoryPath(_this.function.handler);

      // override entry and output
      webpackConfig.entry = './' + _this.function.handler.split('.')[0] + '.' + _this.config.handlerExt;
      webpackConfig.output = {
        libraryTarget: 'commonjs',
        path: _this.evt.data.pathDist,
        filename: bundledFilename
      };

      const pathBundled = _this.pathBundled = path.join(_this.evt.data.pathDist, bundledFilename);   // Save for auditing

      // Perform Bundle
      return new Promise(function (resolve, reject) {
        webpack(webpackConfig).run(function(err, stats) {
          if (err) {
            return reject(err);
          }
          console.log(stats.toString({
            colors: true,
            hash: false,
            version: false,
            chunks: false,
            children: false
          }));

          resolve(_this.pathBundled);
        });
      })
        .then(() => {

          // Save final optimized path
          _this.pathOptimized = pathBundled;

          let envData       = fs.readFileSync(path.join(_this.evt.data.pathDist, '.env')),
            handlerFileName = _this.function.handler.split('.')[0];

          // Reassign pathsPackages property
          _this.evt.data.pathsPackaged = [
            {
              name: handlerFileName + '.js',
              path: _this.pathOptimized
            },
            {
              name: '.env',
              path: path.join(_this.evt.data.pathDist, '.env')
            }
          ];

          if (webpackConfig.devtool === 'source-map') {
            _this.evt.data.pathsPackaged.push({
              name: handlerDirectory + bundledFilename + '.map',
              path: _this.pathOptimized + '.map'
            });
          }

          // Reassign pathsPackages property
          _this.evt.data.pathsPackaged = _this.evt.data.pathsPackaged.concat(_this._generateIncludePaths());
        });
    }

    /**
     * Generate Include Paths
     * - If function.custom.includePaths are specified, include them
     */

    _generateIncludePaths() {

      let _this       = this,
        compressPaths = [],
        ignore        = ['.DS_Store'],
        stats,
        fullPath;

      // Skip if undefined
      if (!_this.config.includePaths) return compressPaths;

      // Collect includePaths
      _this.config.includePaths.forEach(p => {

        try {
          fullPath = path.resolve(path.join(_this.evt.data.pathDist, p));
          stats = fs.lstatSync(fullPath);
        } catch (e) {
          console.error('Cant find includePath ', p, e);
          throw e;
        }

        if (stats.isFile()) {
          compressPaths.push({
            name: p,
            path: fullPath
          });
        } else if (stats.isDirectory()) {

          let dirname = path.basename(p);

          wrench
            .readdirSyncRecursive(fullPath)
            .forEach(file => {

              // Ignore certain files
              for (let i = 0; i < ignore.length; i++) {
                if (file.toLowerCase().indexOf(ignore[i]) > -1) return;
              }

              let filePath = [fullPath, file].join('/');
              if (fs.lstatSync(filePath).isFile()) {
                let pathInZip = path.join(dirname, file);
                compressPaths.push({
                  name: pathInZip,
                  path: filePath
                });
              }
            });
        }
      });

      return compressPaths;
    }
  }

  return ServerlessOptimizer;
};
