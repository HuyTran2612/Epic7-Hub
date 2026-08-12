require('dotenv').config();
const axios = require('axios');
const pool = require('../src/config/db');
const { parseHeroPage } = require('./parser');
const { getAllBackupHeroKeys, fetchBackupHeroData } = require('./ceciliabot-backup');

const DEFAULT_HERO_LIMIT = process.env.SYNC_HERO_LIMIT || 0;
const SLEEP_MS = 500;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncHeroes(limit = DEFAULT_HERO_LIMIT, forceReSync = false) {
  const isUnlimited = limit === 0 || limit === '0' || limit === 'all' || limit === 'ALL';
  const isForce = forceReSync || process.argv.includes('--force');
  console.log(`Starting Dual-Source Hero Sync (Limit: ${isUnlimited ? 'ALL' : limit}, Mode: ${isForce ? 'FORCE UPDATE' : 'INCREMENTAL (NEW ONLY)'})...`);
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  try {
    // Fetch existing keys in DB for incremental check
    const [existingRows] = await pool.query('SELECT key_name FROM heroes');
    const existingKeys = new Set(existingRows.map(r => r.key_name));

    // Fetch Source A keys (epic7db.com)
    let sourceAKeys = [];
    try {
      const listRes = await axios.get('https://epic7db.com/heroes', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      });
      const cheerio = require('cheerio');
      const $ = cheerio.load(listRes.data);
      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && href.startsWith('https://epic7db.com/heroes/') && href !== 'https://epic7db.com/heroes') {
          sourceAKeys.push(href.split('/heroes/')[1]);
        }
      });
    } catch (e) {
      console.warn(`[Source A Warning] epic7db.com hero listing failed: ${e.message}`);
    }

    // Fetch Source B keys (CeciliaBot / Official dataset)
    const sourceBKeys = await getAllBackupHeroKeys();

    // Dual-Source Discovery: Combine unique keys from both sources
    const combinedKeys = [...new Set([...sourceAKeys, ...sourceBKeys])];
    const targetKeys = isUnlimited ? combinedKeys : combinedKeys.slice(0, parseInt(limit, 10));

    console.log(`[Dual-Source Discovery] Source A: ${sourceAKeys.length} | Source B: ${sourceBKeys.length} => Combined Unique Heroes: ${targetKeys.length}. (DB has ${existingKeys.size} heroes)`);

    const sql = `
      INSERT INTO heroes (
        key_name, name, element, class, rarity, is_limited,
        base_stats, skills, recommended_builds, image_url, description, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        element = VALUES(element),
        class = VALUES(class),
        rarity = VALUES(rarity),
        is_limited = VALUES(is_limited),
        base_stats = VALUES(base_stats),
        skills = VALUES(skills),
        recommended_builds = VALUES(recommended_builds),
        image_url = VALUES(image_url),
        description = VALUES(description),
        last_synced_at = NOW()
    `;

    for (const key_name of targetKeys) {
      // Incremental Sync Check: Skip if hero already exists in DB unless forced
      if (!isForce && existingKeys.has(key_name)) {
        skippedCount++;
        continue;
      }

      console.log(`[Dual-Source Sync] Processing hero: ${key_name}...`);
      let hero = null;

      // 1. Fetch from Source A (epic7db.com)
      try {
        const detailRes = await axios.get(`https://epic7db.com/heroes/${key_name}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          timeout: 8000
        });
        hero = parseHeroPage(detailRes.data, key_name);
      } catch (errA) {
        console.warn(`[Source A Unavailable] Could not fetch ${key_name} from epic7db.com: ${errA.message}`);
      }

      // 2. Fetch/Enrich with Source B (CeciliaBot / Official dataset)
      try {
        const backupHero = await fetchBackupHeroData(key_name);
        if (!hero) {
          hero = backupHero;
        } else {
          // Field-Level Data Merging: Fill missing attributes/images from Source B
          hero.element = hero.element || backupHero.element;
          hero.class = hero.class || backupHero.class;
          hero.rarity = hero.rarity || backupHero.rarity;
          if (!hero.image_url || hero.image_url.includes('undefined')) {
            hero.image_url = backupHero.image_url;
          }
        }
      } catch (errB) {
        // Backup fetch warning logged if needed
      }

      if (!hero) {
        console.error(`Failed to sync hero [${key_name}] from both sources.`);
        failCount++;
        continue;
      }

      await pool.query(sql, [
        hero.key_name,
        hero.name,
        hero.element,
        hero.class,
        hero.rarity,
        hero.is_limited,
        JSON.stringify(hero.base_stats),
        JSON.stringify(hero.skills),
        JSON.stringify(hero.recommended_builds),
        hero.image_url,
        hero.description
      ]);

      successCount++;
      await delay(SLEEP_MS);
    }

    const logStatus = failCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed');
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['heroes', logStatus, `Dual-Source Synced ${successCount} new heroes, ${skippedCount} existing skipped (${failCount} failed)`, successCount]
    );

    console.log(`Dual-Source Hero Sync Complete: ${successCount} new added, ${skippedCount} existing skipped, ${failCount} failed.`);
    return { successCount, skippedCount, failCount };
  } catch (err) {
    console.error('Hero Sync Critical Error:', err.message);
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['heroes', 'failed', `Critical error: ${err.message}`, 0]
    );
    throw err;
  }
}

if (require.main === module) {
  syncHeroes().then(() => pool.end()).catch(() => pool.end());
}

module.exports = { syncHeroes };
