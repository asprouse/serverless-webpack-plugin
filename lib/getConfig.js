'use strict';
const path = require('path');

function getCustomConfig(config) {
  return typeof config === 'object' ? config : {};
}

module.exports = function getConfig(projectPath, component, func) {
  const defaults = {
    handlerExt: 'js',
    configPath: ''
  };

  const config = Object.assign(
    defaults,
    getCustomConfig(component.custom.webpack),
    getCustomConfig(func.custom.webpack)
  );

  if (config.configPath) {
    try {
      config.webpackConfig = require(path.join(projectPath, config.configPath));
    } catch (e) {
      console.log(e);
    }
  }

  return config;
};
