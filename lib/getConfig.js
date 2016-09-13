const path = require('path');
const clone = require('clone');

function getCustomConfig(custom) {
  if (custom) {
    const webpack = custom.webpack;
    if (typeof webpack === 'object') {
      return webpack;
    } else if (webpack === false) {
      return { configPath: '' };
    }
  }
  return {};
}

module.exports = function getConfig(projectPath, custom) {
  const defaults = {
    handlerExt: 'js',
    configPath: 'webpack.config.js'
  };

  const config = Object.assign(defaults, getCustomConfig(custom));

  if (config.configPath) {
    try {
      const configPath = path.join(projectPath, config.configPath);
      config.webpackConfig = clone(require(configPath));
    } catch (e) {
      console.log(e);
    }
  }

  return config;
};
