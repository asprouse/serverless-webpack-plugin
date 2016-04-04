const copyModules = require('../lib/copyModules');
const assert = require('chai').assert;
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

describe('copyModules', () => {
  const projectPath = path.join(__dirname, '..');
  const dest = path.join(projectPath, '.tmp');

  before(() => fs.mkdirsAsync(dest));
  after(() => fs.removeAsync(dest));

  it('copys the correct modules', () => {
    const includePaths = ['mocha'];

    return copyModules(projectPath, includePaths, dest)
      .then(() => {
        assert.isTrue(exists(path.join(dest, 'mocha/index.js')));
        assert.isTrue(exists(path.join(dest, 'mocha/lib/browser/debug.js')));
        assert.isTrue(exists(path.join(dest, 'mocha/node_modules/glob/glob.js')));
      });
  });

});
