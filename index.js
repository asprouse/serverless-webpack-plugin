'use strict';
const path = require('path');
const webpack = require('webpack');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

const getConfig = require('./lib/getConfig');
const getExternalsFromStats = require('./lib/getExternalsFromStats');
const copyModules = require('./lib/copyModules');


function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
}

module.exports = function getPlugin(S) {
  const SCli = require(S.getServerlessPath('utils/cli'));

  function logStats(stats) {
    SCli.log(stats.toString({
      colors: true,
      hash: false,
      version: false,
      chunks: false,
      children: false
    }));
  }

  class ServerlessWebpack extends S.classes.Plugin {

    static getName() {
      return `com.serverless.${ServerlessWebpack.name}`;
    }

    registerHooks() {
      S.addHook(this.optimize.bind(this), {
        action: 'codeDeployLambda',
        event: 'pre'
      });

      return Promise.resolve();
    }

    optimize(evt) {
      // Validate: Check Serverless version
      if (parseInt(S._version.split('.')[1], 10) < 5) {
        SCli.log('WARNING: This version of the Serverless Optimizer Plugin ' +
          'will not work with a version of Serverless that is less than v0.5');
      }

      // Get function
      const project = S.getProject();
      const func = project.getFunction(evt.options.name);

      if (func.runtime === 'nodejs' || func.runtime === 'nodejs4.3') {
        const projectPath = S.config.projectPath;
        const config = getConfig(
          projectPath,
          project.toObjectPopulated(evt.options),
          func.toObjectPopulated(evt.options)
        );

        if (config.webpackConfig) {
          const pathDist = evt.options.pathDist;
          const optimizedPath = path.join(pathDist, 'optimized');
          const optimizedModulesPath = path.join(optimizedPath, 'node_modules');

          const webpackConfig = Object.assign({}, config.webpackConfig);
          const handlerName = func.getHandler().split('.')[0];
          const handlerFileName = `${handlerName}.${config.handlerExt}`;
          const handlerEntryPath = path.join(pathDist, handlerFileName);

          // override entry and output
          webpackConfig.context = path.dirname(func.getFilePath());
          if (Array.isArray(webpackConfig.entry)) {
            webpackConfig.entry.push(handlerEntryPath);
          } else {
            webpackConfig.entry = handlerEntryPath;
          }
          webpackConfig.output = {
            libraryTarget: 'commonjs',
            path: optimizedPath,
            filename: handlerFileName
          };

          // copy generated handler so we can build directly from the source directory
          const generatedHandler = path.join(webpackConfig.context, handlerFileName);

          return fs.copyAsync(path.join(pathDist, handlerFileName), generatedHandler)
            .then(() => fs.mkdirsAsync(optimizedModulesPath))
            .then(() => runWebpack(webpackConfig))
            .then((stats) => {
              logStats(stats);
              const externals = getExternalsFromStats(stats);
              return copyModules(projectPath, externals, optimizedModulesPath);
            })
            .then(() => {
              evt.options.pathDist = optimizedPath; // eslint-disable-line
              return evt;
            })
            // delete generated handler we copied above
            .finally(() => fs.removeAsync(generatedHandler));
        }
      }

      return Promise.resolve(evt);
    }
  }

  return ServerlessWebpack;
};
