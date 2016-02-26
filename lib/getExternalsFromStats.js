'use strict';
const natives = process.binding('natives');

module.exports = function getExternalsFromStats(stats) {
  const options = {
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: true,
    reasons: false,
    children: false,
    source: false,
    errors: false,
    errorDetails: false,
    warnings: false,
    publicPath: false,
    exclude: [/^(?!external )/]
  };

  const externalModules = stats.toJson(options).modules;
  return externalModules
    .map(module => /external "(.+)"/.exec(module.identifier)[1])
    // exclude aws-sdk since it is provided by lambda
    // also exclude native node.js modules
    .filter(id => id !== 'aws-sdk' && !natives[id]);
};
