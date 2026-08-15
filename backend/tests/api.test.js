const { test, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const request = supertest(app);

after(async () => {
  await pool.end();
});

describe('Phase 2 - Backend REST API Endpoints', () => {

  test('GET /api/health - Health check endpoint', async () => {
    const res = await request.get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Epic7-Hub API is running');
  });

  test('GET /api/heroes - List heroes with pagination', async () => {
    const res = await request.get('/api/heroes');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.pagination.page, 1);
  });

  test('GET /api/heroes?element=Dark - Filter heroes by element', async () => {
    const res = await request.get('/api/heroes?element=Dark');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every(h => h.element === 'Dark'));
  });

  test('GET /api/heroes/:key - Get hero details', async () => {
    const res = await request.get('/api/heroes/arbiter-vildred');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.key_name, 'arbiter-vildred');
    assert.equal(res.body.data.name, 'Arbiter Vildred');
  });

  test('GET /api/heroes/:key - Return 404 for invalid key', async () => {
    const res = await request.get('/api/heroes/invalid-hero-key');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('GET /api/heroes/:key/recommendations - Get artifact recommendations', async () => {
    const res = await request.get('/api/heroes/arbiter-vildred/recommendations');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('GET /api/artifacts - List artifacts', async () => {
    const res = await request.get('/api/artifacts');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('GET /api/artifacts/:key - Get artifact detail', async () => {
    const res = await request.get('/api/artifacts/alexas-basket');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.key_name, 'alexas-basket');
  });

  test('Notes API CRUD - GET, POST, PUT, DELETE', async () => {
    // 1. Get notes
    const getRes = await request.get('/api/notes?target_type=hero&target_id=1');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);

    // 2. Create note
    const postRes = await request.post('/api/notes').send({
      target_type: 'hero',
      target_id: 1,
      note: 'Automated test note',
      personal_tier: 'A',
      priority: 5
    });
    assert.equal(postRes.status, 201);
    assert.equal(postRes.body.success, true);
    const createdId = postRes.body.data.id;

    // 3. Update note
    const putRes = await request.put(`/api/notes/${createdId}`).send({
      note: 'Updated test note',
      personal_tier: 'S',
      priority: 10
    });
    assert.equal(putRes.status, 200);
    assert.equal(putRes.body.data.note, 'Updated test note');
    assert.equal(putRes.body.data.personal_tier, 'S');

    // 4. Delete note
    const delRes = await request.delete(`/api/notes/${createdId}`);
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);
  });

});

describe('Phase 5 - Advanced Personal Features & Tier List APIs', () => {

  test('GET /api/tierlist - Returns grouped tierlist data', async () => {
    const res = await request.get('/api/tierlist');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.S);
    assert.ok(res.body.data.A);
    assert.ok(res.body.data.Unranked);
  });

  test('GET /api/tierlist?category=pve - Returns grouped PvE tierlist with ratings', async () => {
    const res = await request.get('/api/tierlist?category=pve');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.S.length > 0, 'Expected S-tier heroes in PvE category');
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

  test('Limited Heroes and Artifacts Classification in DB', async () => {
    const [limHeroes] = await pool.query('SELECT id, key_name, name FROM heroes WHERE is_limited = TRUE OR is_limited = 1');
    assert.ok(limHeroes.length >= 45, `Expected at least 45 limited heroes, got: ${limHeroes.length}`);

    const [limArts] = await pool.query('SELECT id, key_name, name FROM artifacts WHERE is_limited = TRUE OR is_limited = 1');
    assert.ok(limArts.length >= 25, `Expected at least 25 limited artifacts, got: ${limArts.length}`);
  });

});
