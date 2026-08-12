const test = require('node:test');
const assert = require('node:assert/strict');
const { getAllBackupHeroKeys, getAllBackupArtifactKeys } = require('../scripts/ceciliabot-backup');

test('Backup Data Provider - Discover Keys', async () => {
  const heroKeys = await getAllBackupHeroKeys();
  assert.ok(Array.isArray(heroKeys));
  assert.ok(heroKeys.length > 300);
  assert.ok(heroKeys.includes('tamarinne'));

  const artKeys = await getAllBackupArtifactKeys();
  assert.ok(Array.isArray(artKeys));
  assert.ok(artKeys.length > 200);
  assert.ok(artKeys.includes('alexas-basket'));
});
