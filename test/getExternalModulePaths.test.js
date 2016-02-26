const getExternalModulePaths = require('../lib/getExternalModulePaths');
const assert = require('chai').assert;
const path = require('path');

describe('getExternalModulePaths', () => {


  it('gets the correct file paths', () => {
    const componentPath = path.join(__dirname, '..');
    const includePaths = ['mocha'];

    const result = getExternalModulePaths(componentPath, includePaths);

    assert.isArray(result, 'The result should be an array');
    assert.includeDeepMembers(result, [
      {
        name: 'node_modules/mocha/index.js',
        path: path.join(componentPath, 'node_modules/mocha/index.js')
      },
      {
        name: 'node_modules/mocha/lib/browser/debug.js',
        path: path.join(componentPath, 'node_modules/mocha/lib/browser/debug.js')
      },
      {
        name: 'node_modules/mocha/node_modules/glob/glob.js',
        path: path.join(componentPath, 'node_modules/mocha/node_modules/glob/glob.js')
      }
    ]);
  });

});
