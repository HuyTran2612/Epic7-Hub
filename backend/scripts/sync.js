/**
 * Epic7-Hub Unified Data Sync Engine (1-File Pipeline)
 * Handles:
 * 1. Dual-Source Discovery (epic7db.com & Smilegate Official Dataset)
 * 2. HTML Parsing & Data Extraction
 * 3. E7 Codex High-Res Full HD Pose & Illustration Artwork Resolution
 * 4. Automatic Limited Hero & Artifact Classification
 * 5. Official Epic7DB PvE Tier List Synchronization
 */
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../src/config/db');
const { fetchFribbelsData, fetchE7DataStats } = require('./fribbels-e7data-provider');
const { getArtifactClassRestriction } = require('./artifact-class-registry');

const OFFICIAL_HERO_URL = 'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_hero.json';
const OFFICIAL_ARTIFACT_URL = 'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_artifact.json';
const SLEEP_MS = 300;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function slugify(name) {
  if (!name) return '';
  let slug = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const ALIASES = {
    'baal-sezan': 'baal-and-sezan',
    'sage-baal-sezan': 'sage-baal-and-sezan',
    'midsummer-charlotte': 'summer-break-charlotte'
  };

  return ALIASES[slug] || slug;
}

// Full List of 48 Limited Heroes
const LIMITED_HERO_KEYS = new Set([
  'dizzy', 'baiken', 'sol', 'elphelt', 'jack-o',
  'emilia', 'rem', 'ram',
  'rimuru', 'milim', 'shuna',
  'edward-elric', 'roy-mustang', 'riza-hawkeye',
  'ae-winter', 'ae-ningning', 'ae-giselle', 'ae-karina',
  'frieren', 'fern', 'stark',
  'ainz-ooal-gown', 'shalltear', 'albedo',
  'kizuna-ai',
  'bask', 'kikirat-v2', 'lucy', 'veronica', 'summers-disciple-alexa',
  'seaside-bellona', 'holiday-yufine', 'summertime-iseria', 'summer-break-charlotte',
  'midsummer-charlotte', 'ocean-breeze-luluca', 'afternoon-soak-flan', 'festive-eda',
  'landy', 'luna', 'diene', 'fairytale-tenebria', 'cerise', 'amid', 'lethe', 'byblis', 'fumyr', 'frida', 'laia'
]);

// Full List of 30 Limited Artifacts
const LIMITED_ARTIFACT_KEYS = new Set([
  '3f', 'anti-magic-mask', 'azure-comet', 'bottle-of-knowledge', 'champions-trophy',
  'draco-plate', 'epic-artifact-charm', 'exif-detective-ed-gadget', 'greater-artifact-charm',
  'guardian-ice-crystals', 'guide-to-a-decision', 'intoxicating-indulgence', 'jack-os-symbol',
  'jumbo-berry-parfait', 'jumbo-berry-special', 'lesser-artifact-charm', 'ms-confille',
  'necro-undine', 'pipette-lance', 'reingar-special-drink', 'ruby-essence', 'rune-sword',
  'severed-horn-wand', 'sole-consolation', 'star-of-the-deep-sea', 'sweet-miracle',
  'sword-of-holy-light', 'torn-sleeve', 'unfading-memories', 'upgraded-dragon-knuckles', 'wall-of-order'
]);

/**
 * 1. HTML Parsers for epic7db.com
 */
function parseHeroPage(html, urlKey) {
  const $ = cheerio.load(html);
  const name = $('h1').first().text().trim() || urlKey;
  const key_name = slugify(urlKey);
  const elemClassText = $('.description p').first().text().trim() || $('body').text();

  const elements = ['Dark', 'Light', 'Fire', 'Ice', 'Earth'];
  const classes = ['Soul Weaver', 'Warrior', 'Knight', 'Thief', 'Ranger', 'Mage'];

  let element = 'Fire';
  let heroClass = 'Warrior';

  for (const e of elements) {
    if (elemClassText.includes(e)) { element = e; break; }
  }
  for (const c of classes) {
    if (elemClassText.includes(c)) { heroClass = c; break; }
  }

  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const starMatch = metaDesc.match(/(\d)\s*star/i);
  const rarity = starMatch ? parseInt(starMatch[1], 10) : ($('.star-container img').length || 5);

  const bodyText = $('body').text();
  const statMatch = bodyText.match(/Attack:\s*(\d+)\s+Health:\s*(\d+)\s+Defense:\s*(\d+)\s+Speed:\s*(\d+)/i);

  const base_stats = {
    atk: statMatch ? parseInt(statMatch[1], 10) : 1000,
    hp: statMatch ? parseInt(statMatch[2], 10) : 5000,
    def: statMatch ? parseInt(statMatch[3], 10) : 500,
    spd: statMatch ? parseInt(statMatch[4], 10) : 110
  };

  const heroImg = $('img[src*="/images/heroes/"]').first().attr('src');
  const image_url = heroImg ? (heroImg.startsWith('http') ? heroImg : `https://epic7db.com${heroImg}`) : `https://epic7db.com/images/heroes/${key_name}.webp`;
  const description = metaDesc || `${name} is a ${rarity}-star ${element} ${heroClass} in Epic Seven.`;

  const skills = [];
  $('h2, h3, h4').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text && !text.includes('Stats') && !text.includes('Builds') && text.length < 60) {
      skills.push({ name: text });
    }
  });

  return { key_name, name, element, class: heroClass, rarity, base_stats, skills, image_url, description };
}

function parseArtifactPage(html, urlKey) {
  const $ = cheerio.load(html);
  const name = $('h1').first().text().trim() || urlKey;
  const key_name = slugify(urlKey);
  const metaDesc = $('meta[name="description"]').attr('content') || '';

  const starMatch = metaDesc.match(/(\d)\s*star/i);
  const rarity = starMatch ? parseInt(starMatch[1], 10) : 5;

  const classText = `${metaDesc} ${$('body').text()}`;
  const class_restriction = getArtifactClassRestriction(key_name, classText);

  const artImg = $('img[src*="/images/artifacts/"]').first().attr('src');
  const image_url = artImg ? (artImg.startsWith('http') ? artImg : `https://epic7db.com${artImg}`) : `https://epic7db.com/images/artifacts/${key_name}.webp`;

  return {
    key_name,
    name,
    rarity,
    class_restriction,
    base_stats: { atk: 15, hp: 60 },
    max_stats: { atk: 273, hp: 1080 },
    skill_description: metaDesc || `${name} is a ${rarity}-star Artifact in Epic Seven.`,
    skill_max_description: metaDesc || '',
    recommended_heroes: [],
    image_url
  };
}

/**
 * 2. E7 Codex High-Res Full HD Artwork Provider
 */
async function getE7CodexArtwork(keyName, isArtifact = false) {
  try {
    const targetUrl = isArtifact ? `https://e7codex.com/artifacts/${keyName}/` : `https://e7codex.com/heroes/${keyName}/`;
    const res = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 5000
    });
    const $ = cheerio.load(res.data);
    const pattern = isArtifact ? 'art_full' : 'pose.png';
    const artworkSrc = $(`img[src*="${pattern}"]`).first().attr('src');
    if (artworkSrc) {
      return artworkSrc.startsWith('http') ? artworkSrc : `https://e7codex.com${artworkSrc}`;
    }
  } catch (e) {
    // Failover fallback silently handled
  }
  return null;
}

/**
 * 3. Hero Sync Stage
 */
async function syncHeroesStage(limit = 0) {
  console.log('[Stage 1/3] Starting Unified Hero Sync...');
  const isUnlimited = limit === 0 || limit === '0' || limit === 'ALL' || limit === 'all';

  let sourceAKeys = [];
  try {
    const listRes = await axios.get('https://epic7db.com/heroes', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    const $ = cheerio.load(listRes.data);
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('https://epic7db.com/heroes/') && href !== 'https://epic7db.com/heroes') {
        const clean = slugify(href.split('/heroes/')[1]);
        if (clean) sourceAKeys.push(clean);
      }
    });
  } catch (e) {
    console.warn(`[Hero Source A Warning] ${e.message}`);
  }

  // Backup dataset mapping
  let sourceBMap = new Map();
  try {
    const backupRes = await axios.get(OFFICIAL_HERO_URL, { family: 4, timeout: 8000 });
    const heroList = backupRes.data.zh || backupRes.data.en || backupRes.data.ko || backupRes.data || [];
    const jobMap = { warrior: 'Warrior', knight: 'Knight', thief: 'Thief', ranger: 'Ranger', mage: 'Mage', soulweaver: 'Soul Weaver' };
    const elemMap = { fire: 'Fire', ice: 'Ice', wind: 'Earth', light: 'Light', dark: 'Dark' };

    heroList.forEach(item => {
      const cleanKey = slugify(item.name || item.code);
      if (cleanKey) {
        sourceBMap.set(cleanKey, {
          key_name: cleanKey,
          name: item.name,
          element: elemMap[item.attribute_cd] || 'Fire',
          class: jobMap[item.job_cd] || 'Warrior',
          rarity: parseInt(item.grade || 5, 10),
          base_stats: { atk: 1000, hp: 5000, def: 500, spd: 110 },
          skills: [],
          image_url: `https://epic7db.com/images/heroes/${cleanKey}.webp`,
          description: `${item.name} is a hero in Epic Seven.`
        });
      }
    });
  } catch (e) {
    console.warn(`[Hero Source B Warning] ${e.message}`);
  }

  const combinedKeys = [...new Set([...sourceAKeys, ...sourceBMap.keys()])];
  const targetKeys = isUnlimited ? combinedKeys : combinedKeys.slice(0, parseInt(limit, 10));

  const [existingRows] = await pool.query('SELECT key_name FROM heroes');
  const existingKeys = new Set(existingRows.map(r => r.key_name));

  const sql = `
    INSERT INTO heroes (
      key_name, name, element, class, rarity, is_limited,
      base_stats, skills, recommended_builds, image_url, full_artwork_url, description, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      element = VALUES(element),
      class = VALUES(class),
      rarity = VALUES(rarity),
      is_limited = VALUES(is_limited),
      base_stats = VALUES(base_stats),
      skills = VALUES(skills),
      image_url = VALUES(image_url),
      full_artwork_url = VALUES(full_artwork_url),
      description = VALUES(description),
      last_synced_at = NOW()
  `;

  let success = 0, skipped = 0, failed = 0;

  for (const key of targetKeys) {
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    let hero = null;
    try {
      const detailRes = await axios.get(`https://epic7db.com/heroes/${key}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      });
      hero = parseHeroPage(detailRes.data, key);
    } catch (e) {}

    if (!hero && sourceBMap.has(key)) {
      hero = sourceBMap.get(key);
    }

    if (!hero) {
      failed++;
      continue;
    }

    // Source 4 (E7Data): Enrich stats with Level 60 Max Awaken baseline
    const e7Stats = await fetchE7DataStats(key, hero.rarity);
    hero.base_stats = hero.base_stats && hero.base_stats.atk > 0 ? hero.base_stats : e7Stats;

    // Source 2 (Fribbels): Enrich locale translation / metadata if available
    const fribbelsData = await fetchFribbelsData();
    if (fribbelsData && fribbelsData[hero.name]) {
      hero.description = `${hero.name} (${fribbelsData[hero.name]}) - Hero in Epic Seven.`;
    }

    const keyLower = key.toLowerCase();
    hero.is_limited = LIMITED_HERO_KEYS.has(keyLower) || keyLower.startsWith('ae-');
    const hdArt = await getE7CodexArtwork(key, false);
    hero.full_artwork_url = hdArt || hero.image_url;

    await pool.query(sql, [
      hero.key_name, hero.name, hero.element, hero.class, hero.rarity,
      hero.is_limited ? 1 : 0,
      JSON.stringify(hero.base_stats || {}),
      JSON.stringify(hero.skills || []),
      JSON.stringify([]),
      hero.image_url, hero.full_artwork_url, hero.description
    ]);

    success++;
    await delay(SLEEP_MS);
  }

  console.log(`[Stage 1 Complete] Multi-Source Heroes Synced: ${success} new, ${skipped} skipped, ${failed} failed.`);
  return { success, skipped, failed };
}

/**
 * 4. Artifact Sync Stage
 */
async function syncArtifactsStage(limit = 0) {
  console.log('[Stage 2/3] Starting Unified Artifact Sync...');
  const isUnlimited = limit === 0 || limit === '0' || limit === 'ALL' || limit === 'all';

  let sourceAKeys = [];
  try {
    const listRes = await axios.get('https://epic7db.com/artifacts', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    const $ = cheerio.load(listRes.data);
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('https://epic7db.com/artifacts/') && href !== 'https://epic7db.com/artifacts') {
        const clean = slugify(href.split('/artifacts/')[1]);
        if (clean) sourceAKeys.push(clean);
      }
    });
  } catch (e) {
    console.warn(`[Artifact Source A Warning] ${e.message}`);
  }

  let sourceBMap = new Map();
  try {
    const backupRes = await axios.get(OFFICIAL_ARTIFACT_URL, { family: 4, timeout: 8000 });
    const artList = backupRes.data.zh || backupRes.data.en || backupRes.data.ko || backupRes.data || [];
    artList.forEach(item => {
      const artName = item.name || item.code;
      if (!artName) return;
      const cleanKey = slugify(artName);
      if (cleanKey) {
        sourceBMap.set(cleanKey, {
          key_name: cleanKey,
          name: item.name,
          rarity: 5,
          class_restriction: getArtifactClassRestriction(cleanKey),
          base_stats: { atk: 15, hp: 60 },
          max_stats: { atk: 273, hp: 1080 },
          skill_description: `${item.name} is an artifact in Epic Seven.`,
          skill_max_description: '',
          recommended_heroes: [],
          image_url: `https://epic7db.com/images/artifacts/${cleanKey}.webp`
        });
      }
    });
  } catch (e) {
    console.warn(`[Artifact Source B Warning] ${e.message}`);
  }

  const combinedKeys = [...new Set([...sourceAKeys, ...sourceBMap.keys()])];
  const targetKeys = isUnlimited ? combinedKeys : combinedKeys.slice(0, parseInt(limit, 10));

  const [existingRows] = await pool.query('SELECT key_name FROM artifacts');
  const existingKeys = new Set(existingRows.map(r => r.key_name));

  const sql = `
    INSERT INTO artifacts (
      key_name, name, rarity, is_limited, class_restriction,
      base_stats, max_stats, skill_description, skill_max_description,
      recommended_heroes, image_url, full_artwork_url, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      rarity = VALUES(rarity),
      is_limited = VALUES(is_limited),
      class_restriction = VALUES(class_restriction),
      base_stats = VALUES(base_stats),
      max_stats = VALUES(max_stats),
      skill_description = VALUES(skill_description),
      skill_max_description = VALUES(skill_max_description),
      image_url = VALUES(image_url),
      full_artwork_url = VALUES(full_artwork_url),
      last_synced_at = NOW()
  `;

  let success = 0, skipped = 0, failed = 0;

  for (const key of targetKeys) {
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    let art = null;
    try {
      const detailRes = await axios.get(`https://epic7db.com/artifacts/${key}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      });
      art = parseArtifactPage(detailRes.data, key);
    } catch (e) {}

    if (!art && sourceBMap.has(key)) {
      art = sourceBMap.get(key);
    }

    if (!art) {
      failed++;
      continue;
    }
    if (!art.name || art.name === 'null') {
      art.name = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    const keyLower = key.toLowerCase();
    art.is_limited = LIMITED_ARTIFACT_KEYS.has(keyLower);
    const hdArt = await getE7CodexArtwork(key, true);
    art.full_artwork_url = hdArt || art.image_url;

    await pool.query(sql, [
      art.key_name, art.name, art.rarity,
      art.is_limited ? 1 : 0,
      art.class_restriction || 'Common',
      JSON.stringify(art.base_stats || {}),
      JSON.stringify(art.max_stats || {}),
      art.skill_description || '',
      art.skill_max_description || '',
      JSON.stringify(art.recommended_heroes || []),
      art.image_url, art.full_artwork_url
    ]);

    success++;
    await delay(SLEEP_MS);
  }

  console.log(`[Stage 2 Complete] Artifacts Synced: ${success} new, ${skipped} skipped, ${failed} failed.`);
  return { success, skipped, failed };
}

/**
 * 5. PvE Tier List Sync Stage
 */
async function syncPvETierListStage() {
  console.log('[Stage 3/3] Scraping Official PvE Tier List from epic7db.com/tier-list...');

  try {
    const res = await axios.get('https://epic7db.com/tier-list', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 12000
    });

    const html = res.data;
    const pveIdx = html.indexOf('PvE Tier List');
    if (pveIdx === -1) {
      return { success: false, count: 0 };
    }

    const $ = cheerio.load(html.slice(pveIdx));
    const [heroes] = await pool.query('SELECT id, key_name, name FROM heroes');
    const heroMap = new Map();
    heroes.forEach(h => {
      heroMap.set(h.key_name, h);
      const clean = h.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      heroMap.set(`clean:${clean}`, h);
    });

    await pool.query("DELETE FROM user_notes WHERE target_type = 'hero' AND category = 'pve'");

    let syncedCount = 0;
    $('.tierlist-heroes-header').each((_, headerEl) => {
      const imprintImg = $(headerEl).find('img').attr('alt') || $(headerEl).find('img').attr('src') || '';
      let tier = 'B';
      if (imprintImg.includes('SS') || imprintImg.includes('SSS') || imprintImg.includes('S')) tier = 'S';
      else if (imprintImg.includes('A')) tier = 'A';
      else if (imprintImg.includes('B')) tier = 'B';
      else if (imprintImg.includes('C')) tier = 'C';
      else if (imprintImg.includes('D')) tier = 'D';

      $(headerEl).next('.tierlist-heroes').find('li.hero').each((_, heroLi) => {
        const heroName = $(heroLi).attr('data-name') || $(heroLi).find('h3').text().trim();
        const heroHref = $(heroLi).find('a').attr('href') || '';
        const keyName = slugify(heroHref.split('/heroes/')[1]) || slugify(heroName);

        let hero = heroMap.get(keyName) || heroMap.get(`clean:${heroName.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
        if (hero) {
          pool.query(
            "INSERT INTO user_notes (target_type, target_id, note, personal_tier, category, priority) VALUES ('hero', ?, ?, ?, 'pve', 5)",
            [hero.id, `Epic7DB Official PvE Rating: ${tier} Tier`, tier]
          );
          syncedCount++;
        }
      });
    });

    console.log(`[Stage 3 Complete] PvE Tier Ratings Updated: ${syncedCount} heroes.`);
    return { success: true, count: syncedCount };
  } catch (err) {
    console.error(`[Stage 3 Error] ${err.message}`);
    return { success: false, count: 0 };
  }
}

/**
 * Main Sync Entry Point
 */
async function runUnifiedSync() {
  console.log('====================================================');
  console.log('=== EPIC7-HUB UNIFIED 1-FILE DATA SYNC PIPELINE  ===');
  console.log('====================================================');
  const startTime = Date.now();

  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1] || process.env.SYNC_LIMIT || 0;

  try {
    const heroResult = await syncHeroesStage(limitArg);
    const artifactResult = await syncArtifactsStage(limitArg);
    const pveResult = await syncPvETierListStage();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalRecords = heroResult.success + artifactResult.success + pveResult.count;
    const message = `Unified Sync Completed in ${duration}s. Heroes: ${heroResult.success}, Artifacts: ${artifactResult.success}, PvE Ratings: ${pveResult.count}.`;

    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['full', 'success', message, totalRecords]
    );

    console.log(`\n=== SUCCESS: ${message} ===\n`);
  } catch (err) {
    console.error('\n=== CRITICAL SYNC FAILURE:', err.message, '===\n');
    await pool.query(
      'INSERT INTO sync_logs (type, status, message, records_affected) VALUES (?, ?, ?, ?)',
      ['full', 'failed', `Sync failed: ${err.message}`, 0]
    );
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runUnifiedSync();
}

module.exports = { runUnifiedSync, parseHeroPage, parseArtifactPage, getE7CodexArtwork };
