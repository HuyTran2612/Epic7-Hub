require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const tables = ['heroes', 'artifacts', 'hero_artifact_recommendations', 'user_notes', 'sync_logs'];
    console.log('=== Checking Table Row Counts ===');
    for (const t of tables) {
      const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`Table ${t}: ${rows[0].cnt} rows`);
    }

    console.log('=== Verifying Joined Recommendations ===');
    const [recs] = await conn.query(`
      SELECT h.name AS hero, a.name AS artifact, r.note 
      FROM hero_artifact_recommendations r
      JOIN heroes h ON r.hero_id = h.id
      JOIN artifacts a ON r.artifact_id = a.id
    `);
    console.log('Joined Recommendations:', recs);

    await conn.end();
    console.log('PHASE 1 DB VERIFICATION: PASS');
  } catch (err) {
    console.error('VERIFICATION FAIL:', err);
    process.exit(1);
  }
})();
