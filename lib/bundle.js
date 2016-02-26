'use strict';
const webpack = require('./webpack');
const path = require('path');
const fs = require('fs');
const wrench = require('wrench');

/**
 * Generate Include Paths
 * - If function.custom.includePaths are specified, include them
 */

function generateIncludePaths(config, pathDist) {
  const compressPaths = [];
  const ignore = ['.DS_Store'];

  // Skip if undefined
  if (!config.includePaths) {
    return compressPaths;
  }

  // Collect includePaths
  config.includePaths.forEach(p => {
    let fullPath;
    let stats;

    try {
      fullPath = path.resolve(path.join(pathDist, p));
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

      const dirname = path.basename(p);

      wrench
        .readdirSyncRecursive(fullPath)
        .forEach(file => {

          // Ignore certain files
          for (let i = 0; i < ignore.length; i++) {
            if (file.toLowerCase().indexOf(ignore[i]) > -1) return;
          }

          const filePath = [fullPath, file].join('/');
          if (fs.lstatSync(filePath).isFile()) {
            const pathInZip = path.join(dirname, file);
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

module.exports = function bundle(config, pathDist, func) {
  const webpackConfig = config.webpackConfig;
  const handlerName = func.handler.split('.')[0];
  const handlerFileName = `${handlerName}.${config.handlerExt}`;

  // override entry and output

  webpackConfig.entry = `./${handlerFileName}`;
  webpackConfig.output = {
    libraryTarget: 'commonjs',
    path: pathDist,
    filename: handlerFileName
  };

  const pathBundled = path.join(pathDist, handlerFileName);

  // Perform Bundle
  return webpack(webpackConfig).then(() => {
      const pathsPackaged = [
        {
          name: handlerFileName,
          path: pathBundled
        },
        {
          name: '.env',
          path: path.join(pathDist, '.env')
        }
      ];

      if (webpackConfig.devtool === 'source-map') {
        pathsPackaged.push({
          name: `${handlerFileName}.map`,
          path: `${pathBundled}.map`
        });
      }

      // Reassign pathsPackages property
      return pathsPackaged.concat(generateIncludePaths(config, pathDist));
    });
};
