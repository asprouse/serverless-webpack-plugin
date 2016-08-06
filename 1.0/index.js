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
    value: function optimize() {
      var _this = this;

      if (!this.serverless.getVersion().startsWith('1.0')) {
        throw new this.serverless.classes.Error('This version of serverless-webpack-plugin requires Serverless 1.0');
      }
      var servicePath = this.serverless.config.servicePath;
      var serverlessTmpDirPath = _path2.default.join(servicePath, '.serverless');

      var handlerNames = (0, _fp.uniq)((0, _fp.map)(function (f) {
        return f.handler.split('.')[0];
      }, this.serverless.service.functions));
      var entrypoints = (0, _fp.map)(function (h) {
        return './' + h + '.js';
      }, handlerNames);

      var webpackConfig = getConfig(servicePath);
      webpackConfig.context = servicePath;
      webpackConfig.entry = (0, _fp.compact)((0, _fp.concat)(webpackConfig.entry, entrypoints));
      webpackConfig.output = {
        libraryTarget: 'commonjs',
        path: serverlessTmpDirPath,
        filename: artifact
      };

      return runWebpack(webpackConfig).then(function (stats) {
        return _this.serverless.cli.log(format(stats));
      }).then(function () {
        var zip = new _nodeZip2.default();
        (0, _fp.forEach)(function (f) {
          return zip.file(f, _fs2.default.readFileSync(_path2.default.resolve(serverlessTmpDirPath, f)));
        }, [artifact, artifact + '.map']);
        var data = zip.generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          platform: process.platform
        });
        var zipFileName = _this.serverless.service.service + '-' + new Date().getTime().toString() + '.zip';
        var artifactFilePath = _path2.default.resolve(serverlessTmpDirPath, zipFileName);

        _this.serverless.utils.writeFileSync(artifactFilePath, data);
        _this.serverless.service.package.artifact = artifactFilePath;
      });
    }
  }]);
  return ServerlessWebpack;
}();