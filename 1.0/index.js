'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var runWebpack = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(config) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new Promise(function (resolve, reject) {
              (0, _webpack2.default)(config).run(function (err, stats) {
                if (err) {
                  return reject(err);
                }
                resolve(stats);
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

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

module.exports = function () {
  function ServerlessWebpack(serverless) {
    _classCallCheck(this, ServerlessWebpack);

    this.serverless = serverless;
    this.hooks = {
      'before:deploy:createDeploymentPackage': this.optimize.bind(this)
    };
  }

  _createClass(ServerlessWebpack, [{
    key: 'optimize',
    value: function optimize() {
      var _this = this;

      if (!this.serverless.getVersion().startsWith('1.0')) {
        throw new this.serverless.classes.Error('WARNING: This version of serverless-webpack-plugin needs Serverless 1.0');
      }
      var servicePath = this.serverless.config.servicePath;
      var serverlessTmpDirPath = _path2.default.join(servicePath, '.serverless');

      var handlerNames = (0, _fp.uniq)((0, _fp.map)(function (f) {
        return f.handler.split('.')[0];
      }, this.serverless.service.functions));
      var entrypoints = (0, _fp.map)(function (h) {
        return './' + h + '.js';
      }, handlerNames);

      var webpackConfig = require(_path2.default.resolve(servicePath, './webpack.config.js'));
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