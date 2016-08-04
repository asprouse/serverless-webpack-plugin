'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const webpack = require('webpack');
const Zip = require('node-zip');

const compact = require('lodash/fp/compact');
const concat = require('lodash/fp/concat');
const forEach = require('lodash/fp/forEach');
const map = require('lodash/fp/map');
const uniq = require('lodash/fp/uniq');

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

function format(stats) {
  return stats.toString({
    colors: true,
    hash: false,
    version: false,
    chunks: false,
    children: false
  });
}

const artifact = 'handler.js';

module.exports = class ServerlessWebpack {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      'before:deploy:createDeploymentPackage': this.optimize.bind(this)
    };
  }

  optimize() {
    if (this.serverless.getVersion() !== '1.0.0-beta.1') {
      throw new this.serverless.classes.Error(
        'WARNING: This version of serverless-webpack-plugin needs Serverless 1.0.0-beta.1'
      );
    }
    const servicePath = this.serverless.config.servicePath;
    const serverlessTmpDirPath = path.join(servicePath, '.serverless');

    const handlerNames = uniq(map(f => f.handler.split('.')[0], this.serverless.service.functions));
    const entrypoints = map(h => `./${h}.js`, handlerNames);

    const webpackConfig = require(path.resolve(servicePath, './webpack.config.js'));
    webpackConfig.context = servicePath;
    webpackConfig.entry = compact(concat(webpackConfig.entry, entrypoints));
    webpackConfig.output = {
      libraryTarget: 'commonjs',
      path: serverlessTmpDirPath,
      filename: artifact
    };

    return runWebpack(webpackConfig)
    .then(stats => this.serverless.cli.log(format(stats)))
    .then(() => {
      const zip = new Zip();
      forEach(f =>
        zip.file(f, fs.readFileSync(path.resolve(serverlessTmpDirPath, f))
      ), [artifact, `${artifact}.map`]);
      const data = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        platform: process.platform,
      });
      const zipFileName =
        `${this.serverless.service.service}-${(new Date).getTime().toString()}.zip`;
      const artifactFilePath = path.resolve(serverlessTmpDirPath, zipFileName);

      this.serverless.utils.writeFileSync(artifactFilePath, data);
      this.serverless.service.package.artifact = artifactFilePath;
    });
  }
};
