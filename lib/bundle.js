'use strict';
const path = require('path');
const webpack = require('./webpack');
const getExternalsFromStats = require('./getExternalsFromStats');
const getExternalModulePaths = require('./getExternalModulePaths');


module.exports = function bundle(config, pathDist, component, func) {
  const webpackConfig = config.webpackConfig;
  const handlerName = func.handler.split('.')[0];
  const handlerFileName = `${handlerName}.${config.handlerExt}`;

  // override entry and output

  webpackConfig.entry = `./${handlerName.substr(handlerName.lastIndexOf('/') + 1)}`;
  webpackConfig.output = {
    libraryTarget: 'commonjs',
    path: pathDist,
    filename: handlerFileName
  };

  const pathBundled = path.join(pathDist, handlerFileName);

  // Perform Bundle
  return webpack(webpackConfig).then((stats) => {
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
    const externals = getExternalsFromStats(stats);
    const componentPath = component._config.fullPath;
    return pathsPackaged.concat(getExternalModulePaths(componentPath, externals));
  });
};
