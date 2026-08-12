require('dotenv').config();
const axios = require('axios');
const pool = require('../src/config/db');
const { parseArtifactPage } = require('./parser');
const { getAllBackupArtifactKeys, fetchBackupArtifactData } = require('./ceciliabot-backup');

const DEFAULT_ARTIFACT_LIMIT = process.env.SYNC_ARTIFACT_LIMIT || 0;
const SLEEP_MS = 500;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncArtifacts(limit = DEFAULT_ARTIFACT_LIMIT, forceReSync = false) {
  const isUnlimited = limit === 0 || limit === '0' || limit === 'all' || limit === 'ALL';
  const isForce = forceReSync || process.argv.includes('--force');
  console.log(`Starting Dual-Source Artifact Sync (Limit: ${isUnlimited ? 'ALL' : limit}, Mode: ${isForce ? 'FORCE UPDATE' : 'INCREMENTAL (NEW ONLY)'})...`);
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  try {
    // Fetch existing keys in DB for incremental check
    const [existingRows] = await pool.query('SELECT key_name FROM artifacts');
    const existingKeys = new Set(existingRows.map(r => r.key_name));

    // Fetch Source A keys (epic7db.com)
    let sourceAKeys = [];
    try {
      const listRes = await axios.get('https://epic7db.com/artifacts', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      });
      const cheerio = require('cheerio');
      const $ = cheerio.load(listRes.data);
      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && href.startsWith('https://epic7db.com/artifacts/') && href !== 'https://epic7db.com/artifacts') {
          sourceAKeys.push(href.split('/artifacts/')[1]);
        }
      });
    } catch (e) {
      console.warn(`[Source A Warning] epic7db.com artifact listing failed: ${e.message}`);
    }

    // Fetch Source B keys (CeciliaBot / Official dataset)
    const sourceBKeys = await getAllBackupArtifactKeys();

    // Dual-Source Discovery: Combine unique keys from both sources
    const combinedKeys = [...new Set([...sourceAKeys, ...sourceBKeys])];
    const targetKeys = isUnlimited ? combinedKeys : combinedKeys.slice(0, parseInt(limit, 10));

    console.log(`[Dual-Source Discovery] Source A: ${sourceAKeys.length} | Source B: ${sourceBKeys.length} => Combined Unique Artifacts: ${targetKeys.length}. (DB has ${existingKeys.size} artifacts)`);

    const sql = `
      INSERT INTO artifacts (
        key_name, name, rarity, class_restriction,
        base_stats, max_stats, skill_description, skill_max_description,
        recommended_heroes, image_url, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        rarity = VALUES(rarity),
        class_restriction = VALUES(class_restriction),
        base_stats = VALUES(base_stats),
        max_stats = VALUES(max_stats),
        skill_description = VALUES(skill_description),
        skill_max_description = VALUES(skill_max_description),
        recommended_heroes = VALUES(recommended_heroes),
        image_url = VALUES(image_url),
        last_synced_at = NOW()
    `;

    for (const key_name of targetKeys) {
      // Incremental Sync Check: Skip if artifact already exists in DB unless forced
      if (!isForce && existingKeys.has(key_name)) {
        skippedCount++;
        continue;
      }

      console.log(`[Dual-Source Sync] Processing artifact: ${key_name}...`);
      let artifact = null;

      // 1. Fetch from Source A (epic7db.com)
      try {
        const detailRes = await axios.get(`https://epic7db.com/artifacts/${key_name}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          timeout: 8000
        });
        artifact = parseArtifactPage(detailRes.data, key_name);
      } catch (errA) {
        console.warn(`[Source A Unavailable] Could not fetch ${key_name} from epic7db.com: ${errA.message}`);
      }

      // 2. Fetch/Enrich with Source B (CeciliaBot / Official dataset)
      try {
        const backupArt = await fetchBackupArtifactData(key_name);
        if (!artifact) {
          artifact = backupArt;
        } else {
          // Field-Level Data Merging: Fill missing attributes/images from Source B
          artifact.rarity = artifact.rarity || backupArt.rarity;
          artifact.class_restriction = artifact.class_restriction || backupArt.class_restriction;
          if (!artifact.image_url || artifact.image_url.includes('undefined')) {
            artifact.image_url = backupArt.image_url;
          }
        }
      } catch (errB) {
        // Backup fetch warning logged if needed
      }

      if (!artifact) {
        console.error(`Failed to sync artifact [${key_name}] from both sources.`);
        failCount++;
        continue;
      }

      await pool.query(sql, [
        artifact.key_name,
        artifact.name,
        artifact.rarity,
        artifact.class_restriction,
        JSON.stringify(artifact.base_stats),
        JSON.stringify(artifact.max_stats),
        artifact.skill_description,
        artifact.skill_max_description,
        JSON.stringify(artifact.recommended_heroes),
        artifact.image_url
      ]);

      successCount++;
      await delay(SLEEP_MS);
    }

    const logStatus = failCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed');
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['artifacts', logStatus, `Dual-Source Synced ${successCount} new artifacts, ${skippedCount} existing skipped (${failCount} failed)`, successCount]
    );

    console.log(`Dual-Source Artifact Sync Complete: ${successCount} new added, ${skippedCount} existing skipped, ${failCount} failed.`);
    return { successCount, skippedCount, failCount };
  } catch (err) {
    console.error('Artifact Sync Critical Error:', err.message);
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['artifacts', 'failed', `Critical error: ${err.message}`, 0]
    );
    throw err;
  }
}

if (require.main === module) {
  syncArtifacts().then(() => pool.end()).catch(() => pool.end());
}

module.exports = { syncArtifacts };
