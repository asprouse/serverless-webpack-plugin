'use strict';
const path = require('path');
const webpack = require('./webpack');
const getExternalsFromStats = require('./getExternalsFromStats');
const getExternalModulePaths = require('./getExternalModulePaths');
const fs = require('fs');


module.exports = function bundle(config, pathDist, component, func) {
  const componentPath = component._config.fullPath;
  const webpackConfig = config.webpackConfig;
  const handlerName = func.handler.split('.')[0];
  const handlerFileName = `${handlerName}.${config.handlerExt}`;

  // override entry and output

  webpackConfig.context = componentPath;
  webpackConfig.entry = `./${handlerFileName}`;
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
    fs.writeFile(path.join(pathDist, 'stats.json'), JSON.stringify(stats.toJson({json: true})), function(err){
      if(err){
        console.log(err);
      }
    });

    // Reassign pathsPackages property
    const externals = getExternalsFromStats(stats);
    return pathsPackaged.concat(getExternalModulePaths(componentPath, externals));
  });
};
