'use strict';
const path = require('path');
const childProcess = require('child_process');
const Promise = require('bluebird');

const exec = Promise.promisify(childProcess.exec);

module.exports = function copyModules(projectPath, moduleNames, dest) {
  const pkg = require(path.join(projectPath, 'package.json'));
  const modulesAndVersions = moduleNames.map(moduleName => {
    const moduleVersion = pkg.dependencies[moduleName];
    return `${moduleName}@${moduleVersion}`;
  });
  const opts = {
    cwd: path.join(dest)
  };
  const installString = modulesAndVersions.join(' ');

  // Run 'npm install' on each module to get a full set of dependencies,
  // not just the directly copied ones.
  return exec(`npm install --production ${installString}`, opts);
};
