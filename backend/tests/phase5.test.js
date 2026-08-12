const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const request = supertest(app);

after(async () => {
  await pool.end();
});

describe('Phase 5 - Advanced Personal Features APIs', () => {

  test('GET /api/tierlist - Returns grouped tierlist data', async () => {
    const res = await request.get('/api/tierlist');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.S);
    assert.ok(res.body.data.A);
    assert.ok(res.body.data.Unranked);
  });

  test('GET /api/stats - Returns aggregated breakdown statistics', async () => {
    const res = await request.get('/api/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.data.totalHeroes === 'number');
    assert.ok(typeof res.body.data.totalArtifacts === 'number');
    assert.ok(Array.isArray(res.body.data.byElement));
    assert.ok(Array.isArray(res.body.data.byClass));
  });

  test('GET /api/backup/export & POST /api/backup/import', async () => {
    // Export
    const exportRes = await request.get('/api/backup/export');
    assert.equal(exportRes.status, 200);
    assert.ok(exportRes.body.version);
    assert.ok(Array.isArray(exportRes.body.user_notes));

    // Import
    const importRes = await request.post('/api/backup/import').send({
      user_notes: [
        { target_type: 'hero', target_id: 2, note: 'Imported test note', personal_tier: 'S', priority: 10 }
      ]
    });
    assert.equal(importRes.status, 200);
    assert.equal(importRes.body.success, true);
  });

});
