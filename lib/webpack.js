'use strict';
const webpack = require('webpack');

module.exports = function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString({
        colors: true,
        hash: false,
        version: false,
        chunks: false,
        children: false
      }));

      resolve(stats);
    });
  });
};
