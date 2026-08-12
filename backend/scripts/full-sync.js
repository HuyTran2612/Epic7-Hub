require('dotenv').config();
const pool = require('../src/config/db');
const { syncHeroes } = require('./sync-heroes');
const { syncArtifacts } = require('./sync-artifacts');

async function runFullSync() {
  console.log('=== Starting Full Sync Pipeline ===');
  const startTime = Date.now();

  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1] || process.env.SYNC_LIMIT || 0;

  try {
    const heroResult = await syncHeroes(limitArg);
    const artifactResult = await syncArtifacts(limitArg);

    const totalRecords = heroResult.successCount + artifactResult.successCount;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const message = `Full sync completed in ${duration}s. Heroes: ${heroResult.successCount}/${heroResult.successCount + heroResult.failCount}, Artifacts: ${artifactResult.successCount}/${artifactResult.successCount + artifactResult.failCount}.`;

    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['full', 'success', message, totalRecords]
    );

    console.log(`=== ${message} ===`);
  } catch (err) {
    console.error('Full Sync Failed:', err.message);
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['full', 'failed', `Full sync failed: ${err.message}`, 0]
    );
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runFullSync();
}

module.exports = { runFullSync };
