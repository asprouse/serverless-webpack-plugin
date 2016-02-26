'use strict';
const path = require('path');
const fs = require('fs');
const wrench = require('wrench');

module.exports = function getExternalModulePaths(componentPath, includePaths) {
  const compressPaths = [];
  const ignore = ['.DS_Store'];

  // Collect includePaths
  includePaths.forEach(p => {
    let fullPath;
    let stats;

    try {
      fullPath = path.resolve(path.join(componentPath, 'node_modules', p));
      stats = fs.lstatSync(fullPath);
    } catch (e) {
      console.error('Cant find includePath ', p, e);
      throw e;
    }

    if (stats.isFile()) {
      compressPaths.push({
        name: p,
        path: fullPath
      });
    } else if (stats.isDirectory()) {

      const dirname = path.join('node_modules', path.basename(p));

      wrench
        .readdirSyncRecursive(fullPath)
        .forEach(file => {

          // Ignore certain files
          for (let i = 0; i < ignore.length; i++) {
            if (file.toLowerCase().indexOf(ignore[i]) > -1) return;
          }

          const filePath = path.join(fullPath, file);
          if (fs.lstatSync(filePath).isFile()) {
            const pathInZip = path.join(dirname, file);
            compressPaths.push({
              name: pathInZip,
              path: filePath
            });
          }
        });
    }
  });

  return compressPaths;
};
