const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const request = supertest(app);

after(async () => {
  await pool.end();
});

describe('Phase 2 - Backend API Endpoints', () => {

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
