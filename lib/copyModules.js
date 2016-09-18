const path = require('path');
const childProcess = require('child_process');
const Promise = require('bluebird');

const exec = Promise.promisify(childProcess.execFile);

module.exports = function copyModules(projectPath, moduleNames, dest) {
  // No dependencies, just return, so that npm install would not fail.
  if (moduleNames.length === 0) {
    return Promise.resolve();
  }

  const pkg = require(path.join(projectPath, 'package.json')); // eslint-disable-line global-require
  const modulesAndVersions = moduleNames.map(moduleName => {
    const moduleVersion = pkg.dependencies[moduleName];

    // If no module version was found, throw an error
    if (!moduleVersion) {
      throw new Error(`Error: Could not find module ${moduleName} in package.json!`);
    }

    return `${moduleName}@${moduleVersion}`;
  });
  const opts = { cwd: path.join(dest), env: process.env };
  const args = ['install', '--production'].concat(modulesAndVersions);

  // Run 'npm install' on each module to get a full set of dependencies,
  // not just the directly copied ones.
  return exec('npm', args, opts);
};
