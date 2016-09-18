const path = require('path');
const clone = require('clone');

function getCustomConfig(obj) {
  if (obj.custom) {
    const webpack = obj.custom.webpack;
    if (typeof webpack === 'object') {
      return webpack;
    } else if (webpack === false) {
      return { configPath: '' };
    }
  }
  return { };
}

module.exports = function getConfig(projectPath, project, func) {
  const defaults = {
    handlerExt: 'js',
    configPath: ''
  };

  const config = Object.assign(defaults, getCustomConfig(project), getCustomConfig(func));

  if (config.configPath) {
    try {
      const configPath = path.join(projectPath, config.configPath);
      config.webpackConfig = clone(require(configPath)); // eslint-disable-line global-require
    } catch (e) {
      console.log(e); // eslint-disable-line no-console
    }
  }

  return config;
};
