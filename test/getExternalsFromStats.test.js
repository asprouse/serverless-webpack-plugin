const getExternalsFromStats = require('../lib/getExternalsFromStats');
const assert = require('chai').assert;

function getStatsMock() {
  return {
    toJson() {
      return {
        modules: require('./data/stats.json').slice(0) // eslint-disable-line global-require
      };
    }
  };
}

describe('getExternalsFromStats', () => {

  it('filters out aws-sdk and native node modules', () => {
    const stats = getStatsMock();
    const result = getExternalsFromStats(stats);

    assert.isArray(result, 'The result should be an array');
    assert.lengthOf(result, 1);
    assert.strictEqual(result[0], 'serverless-helpers-js');

  });

});
