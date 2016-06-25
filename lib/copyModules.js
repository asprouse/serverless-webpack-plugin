'use strict';
const path = require('path');
const childProcess = require('child_process');
const Promise = require('bluebird');

const exec = Promise.promisify(childProcess.exec);

module.exports = function copyModules(projectPath, moduleNames, dest) {
  const pkg = require(path.join(projectPath, 'package.json'));

  return Promise.all(moduleNames.map(moduleName => {
    const moduleVersion = pkg.dependencies[moduleName];

    if (!moduleVersion) {
      const error = new Error(`No module ${moduleName} found in package.json`);
      return Promise.reject(error);
    }

    // Run 'npm install' on each module to get a full set of dependencies,
    // not just the directly copied ones.
    const opts = {
      cwd: path.join(dest)
    }

    return exec(`npm install --production ${moduleName}@${moduleVersion}`, opts);
  }));
};
