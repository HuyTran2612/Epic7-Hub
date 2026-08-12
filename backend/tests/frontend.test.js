const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const request = supertest(app);

after(async () => {
  await pool.end();
});

describe('Phase 4 - Static Frontend Serving', () => {

  test('GET / - Serves index.html', async () => {
    const res = await request.get('/');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('Epic7 Personal DB'));
    assert.ok(res.text.includes('id="global-search"'));
  });

  test('GET /css/style.css - Serves CSS design system', async () => {
    const res = await request.get('/css/style.css');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('--bg-dark'));
    assert.ok(res.text.includes('--elem-fire'));
  });

  test('GET /js/app.js - Serves frontend JS module', async () => {
    const res = await request.get('/js/app.js');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('renderHeroesSection'));
  });

});
