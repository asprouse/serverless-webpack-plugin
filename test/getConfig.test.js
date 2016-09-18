const assert = require('chai').assert;
const getConfig = require('../lib/getConfig');
const path = require('path');

const projectPath = path.resolve('./test/data');

describe.only('getConfig', () => {

  it('assigns defaults', () => {
    const project = {};
    const func = {};
    const result = getConfig(projectPath, project, func);

    assert.deepEqual(result, { handlerExt: 'js', configPath: '' });
  });

  it('respects custom project config', () => {
    const project = {
      custom: {
        webpack: {
          configPath: './webpack.conf.js'
        }
      }
    };
    const func = {};
    const result = getConfig(projectPath, project, func);

    assert.deepEqual(result, {
      handlerExt: 'js',
      configPath: './webpack.conf.js',
      webpackConfig: {
        target: 'node',
        externals: [
          'aws-sdk'
        ],
        resolve: {
          extensions: ['', '.js', '.jsx']
        },
        module: {
          loaders: [
            {
              test: /\.json$/,
              loader: 'json',
            }
          ]
        }
      }
    });
  });

  it('respects custom func config', () => {
    const project = {};
    const func = {
      custom: {
        webpack: {
          configPath: './webpack.conf.js'
        }
      }
    };
    const result = getConfig(projectPath, project, func);

    assert.deepEqual(result, {
      handlerExt: 'js',
      configPath: './webpack.conf.js',
      webpackConfig: {
        target: 'node',
        externals: [
          'aws-sdk'
        ],
        resolve: {
          extensions: ['', '.js', '.jsx']
        },
        module: {
          loaders: [
            {
              test: /\.json$/,
              loader: 'json',
            }
          ]
        }
      }
    });
  });

  it('creates a unique webpack config', () => {
    const project = {
      custom: {
        webpack: {
          configPath: './webpack.conf.js'
        }
      }
    };
    const func = {};
    const result = getConfig(projectPath, project, func);
    const webpackConfig = require('./data/webpack.conf.js'); // eslint-disable-line global-require

    assert.notStrictEqual(result.webpackConfig, webpackConfig);
    assert.deepEqual(result, {
      handlerExt: 'js',
      configPath: './webpack.conf.js',
      webpackConfig: {
        target: 'node',
        externals: [
          'aws-sdk'
        ],
        resolve: {
          extensions: ['', '.js', '.jsx']
        },
        module: {
          loaders: [
            {
              test: /\.json$/,
              loader: 'json',
            }
          ]
        }
      }
    });
  });

});
