'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var runWebpack = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(config) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
              (0, _webpack2.default)(config).run(function (err, stats) {
                if (err) {
                  return reject(err);
                }
                return resolve(stats);
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function runWebpack(_x) {
    return _ref.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _nodeZip = require('node-zip');

var _nodeZip2 = _interopRequireDefault(_nodeZip);

var _fp = require('lodash/fp');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function format(stats) {
  return stats.toString({
    colors: true,
    hash: false,
    version: false,
    chunks: false,
    children: false
  });
}

var artifact = 'handler.js';

var getConfig = function getConfig(servicePath) {
  return require(_path2.default.resolve(servicePath, './webpack.config.js'));
}; // eslint-disable-line global-require

var zip = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(zipper, readFile, tmpDir) {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _promise2.default.all((0, _fp.map)(function () {
              var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(file) {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.t0 = zipper;
                        _context2.t1 = file;
                        _context2.next = 4;
                        return readFile(_path2.default.resolve(tmpDir, file));

                      case 4:
                        _context2.t2 = _context2.sent;
                        return _context2.abrupt('return', _context2.t0.file.call(_context2.t0, _context2.t1, _context2.t2));

                      case 6:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }(), [artifact, artifact + '.map']));

          case 2:
            return _context3.abrupt('return', zipper.generate({
              type: 'nodebuffer',
              compression: 'DEFLATE',
              platform: process.platform
            }));

          case 3:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function zip(_x2, _x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = function () {
  function ServerlessWebpack(serverless) {
    (0, _classCallCheck3.default)(this, ServerlessWebpack);

    this.serverless = serverless;
    this.hooks = {
      'before:deploy:createDeploymentPackage': this.optimize.bind(this)
    };
  }

  (0, _createClass3.default)(ServerlessWebpack, [{
    key: 'optimize',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
        var servicePath, serverlessTmpDirPath, handlerNames, entrypoints, webpackConfig, stats, data, zipFileName, artifactFilePath;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (this.serverless.getVersion().startsWith('1.0')) {
                  _context4.next = 2;
                  break;
                }

                throw new this.serverless.classes.Error('This version of serverless-webpack-plugin requires Serverless 1.0');

              case 2:
                servicePath = this.serverless.config.servicePath;
                serverlessTmpDirPath = _path2.default.join(servicePath, '.serverless');
                handlerNames = (0, _fp.uniq)((0, _fp.map)(function (f) {
                  return f.handler.split('.')[0];
                }, this.serverless.service.functions));
                entrypoints = (0, _fp.map)(function (h) {
                  return './' + h + '.js';
                }, handlerNames);
                webpackConfig = getConfig(servicePath);

                webpackConfig.context = servicePath;
                webpackConfig.entry = (0, _fp.compact)((0, _fp.concat)(webpackConfig.entry, entrypoints));
                webpackConfig.output = {
                  libraryTarget: 'commonjs',
                  path: serverlessTmpDirPath,
                  filename: artifact
                };

                _context4.next = 12;
                return runWebpack(webpackConfig);

              case 12:
                stats = _context4.sent;

                this.serverless.cli.log(format(stats));

                _context4.next = 16;
                return zip(new _nodeZip2.default(), _fs2.default.readFile, serverlessTmpDirPath);

              case 16:
                data = _context4.sent;
                zipFileName = this.serverless.service.service + '-' + new Date().getTime().toString() + '.zip';
                artifactFilePath = _path2.default.resolve(serverlessTmpDirPath, zipFileName);


                this.serverless.utils.writeFileSync(artifactFilePath, data);
                this.serverless.service.package.artifact = artifactFilePath;

              case 21:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function optimize() {
        return _ref4.apply(this, arguments);
      }

      return optimize;
    }()
  }]);
  return ServerlessWebpack;
}();