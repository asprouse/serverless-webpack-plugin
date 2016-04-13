'use strict';
const getConfig = require('./lib/getConfig');
const bundle = require('./lib/bundle');

module.exports = function getPlugin(ServerlessPlugin) {
  class ServerlessWebpack extends ServerlessPlugin {

    /**
     * Define your plugins name
     */
    static getName() {
      return `com.serverless.${ServerlessWebpack.name}`;
    }

    /**
     * Register Hooks
     */
    registerHooks() {
      this.S.addHook(this._optimize.bind(this), {
        action: 'codePackageLambda',
        event: 'post'
      });

      return Promise.resolve();
    }

    /**
     * Optimize
     */
    _optimize(evt) {
      // Validate: Check Serverless version
      if (parseInt(this.S._version.split('.')[1], 10) < 2) {
        console.log('WARNING: This version of the Serverless Optimizer Plugin ' +
          'will not work with a version of Serverless that is less than v0.2.');
      }

      // Get function
      const func = this.S.state.getFunctions({ paths: [evt.options.path] })[0];
      const component = func.getComponent();

      if (component.runtime.indexOf('nodejs')  === 0) {
        const projectPath = this.S.config.projectPath;
        const config = getConfig(projectPath, component, func);

        if (config.webpackConfig) {
          const pathDist = evt.data.pathDist;
          return bundle(config, pathDist, component, func)
            .then(pathsPackaged => {
              evt.data.pathsPackaged = pathsPackaged; // eslint-disable-line
              return evt;
            });
        }
      }

      return Promise.resolve(evt);
    }
  }

  return ServerlessWebpack;
};
