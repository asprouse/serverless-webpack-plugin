const path = require('path');
const webpack = require('webpack');
const Promise = require('bluebird');
const mkdirs = Promise.promisify(require('fs-extra').mkdirs);

const getConfig = require('./lib/getConfig');
const getExternalsFromStats = require('./lib/getExternalsFromStats');
const copyModules = require('./lib/copyModules');

function runWebpack(config) {
  console.log('running');
  return new Promise((resolve, reject) =>  {
    webpack(config).run((err, stats) => {
      if (err) {
        console.log('webpack error');
        return reject(err);
      }
      console.log('done with packing');
      return resolve(stats);
    });
  });
}

module.exports = class ServerlessWebpack {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:deploy:compileFunctions': this.optimize.bind(this)
    };
    this.logStats.bind(this);
  }

  optimize() {
    // Validate: Check Serverless version
    if (parseInt(this.serverless.version.split('.')[0], 10) < 1) {
      this.serverless.cli.log('WARNING: This version of the Serverless Optimizer Plugin ' +
        'will not work with a version of Serverless that is less than v1');
    }
    const { runtime } = this.serverless.service.provider;
    if (runtime === 'nodejs' || runtime === 'nodejs4.3') {
      const currentDir = this.serverless.config.servicePath;
      const config = getConfig(currentDir, this.serverless.service.provider.custom);

      if (config.webpackConfig) {
        const pathDist = this.options.pathDist || '.serverless';
        const optimizedPath = path.join(pathDist, 'optimized');
        const optimizedModulesPath = path.join(optimizedPath, 'node_modules');

        const webpackConfig = Object.assign({}, config.webpackConfig);

        const handlerFileName = 'handler.js';
        const handlerEntryPath = `./${handlerFileName}`;
        // override entry and output
        webpackConfig.context = path.dirname(handlerEntryPath);
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

        return mkdirs(optimizedModulesPath)
          .then(() => runWebpack(webpackConfig))
          .then((stats) => {
            this.logStats(stats);
            const externals = getExternalsFromStats(stats);
            return copyModules(currentDir, externals, optimizedModulesPath);
          })
          .then(() => {
            this.options.pathDist = optimizedPath; // eslint-disable-line
            return this;
          });
      }
    }
    return null;
  }

  logStats(stats) {
    this.serverless.cli.log(stats.toString({
      colors: true,
      hash: false,
      version: false,
      chunks: false,
      children: false
    }));
  }
};
