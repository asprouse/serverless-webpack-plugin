import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import Zip from 'node-zip';

import {
  compact,
  concat,
  forEach,
  map,
  uniq,
} from 'lodash/fp';

async function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        return reject(err);
      }
      return resolve(stats);
    });
  });
}

function format(stats) {
  return stats.toString({
    colors: true,
    hash: false,
    version: false,
    chunks: false,
    children: false,
  });
}

const artifact = 'handler.js';

const getConfig = servicePath =>
  require(path.resolve(servicePath, './webpack.config.js')); // eslint-disable-line global-require

export default class ServerlessWebpack {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      'before:deploy:createDeploymentPackage': this.optimize.bind(this),
    };
  }

  optimize() {
    if (!this.serverless.getVersion().startsWith('1.0')) {
      throw new this.serverless.classes.Error(
        'This version of serverless-webpack-plugin requires Serverless 1.0'
      );
    }
    const servicePath = this.serverless.config.servicePath;
    const serverlessTmpDirPath = path.join(servicePath, '.serverless');

    const handlerNames = uniq(map(f => f.handler.split('.')[0], this.serverless.service.functions));
    const entrypoints = map(h => `./${h}.js`, handlerNames);

    const webpackConfig = getConfig(servicePath);
    webpackConfig.context = servicePath;
    webpackConfig.entry = compact(concat(webpackConfig.entry, entrypoints));
    webpackConfig.output = {
      libraryTarget: 'commonjs',
      path: serverlessTmpDirPath,
      filename: artifact,
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
}
