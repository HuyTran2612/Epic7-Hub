const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchFribbelsData, fetchE7DataStats } = require('../scripts/fribbels-e7data-provider');

test('Multi-Source Data Integrator - Fribbels & E7Data', async () => {
  const fribbelsMap = await fetchFribbelsData();
  assert.ok(fribbelsMap);
  assert.ok(typeof fribbelsMap === 'object');

  const stats = await fetchE7DataStats('tamarinne', 5);
  assert.ok(stats.hp > 4000);
  assert.ok(stats.spd > 100);
});
