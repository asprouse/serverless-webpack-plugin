'use strict';
const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');

const copy = Promise.promisify(fs.copy);

module.exports = function copyModules(projectPath, moduleNames, dest) {
  return Promise.all(moduleNames.map(moduleName => {
    const modulePath = path.join(projectPath, 'node_modules', moduleName);
    return copy(modulePath, path.join(dest, moduleName));
  }));
};
