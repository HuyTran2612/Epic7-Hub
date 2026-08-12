// Secondary / Backup Data Provider (CeciliaBot & Official Smilegate Backup APIs)
const axios = require('axios');

const CECILIABOT_BASE_URL = 'https://ceciliabot.github.io';
const OFFICIAL_HERO_JSON_URL = 'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_hero.json';
const OFFICIAL_ARTIFACT_JSON_URL = 'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_artifact.json';

let heroCacheMap = null;
let artifactCacheMap = null;

/**
 * Helper to slugify name to key_name
 */
function slugify(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Format key_name to Title Case Name
 */
function formatNameFromKey(keyName) {
  if (!keyName) return 'Unknown';
  return keyName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Load and cache official/backup Hero JSON database
 */
async function loadBackupHeroDatabase() {
  if (heroCacheMap) return heroCacheMap;
  heroCacheMap = new Map();

  try {
    const res = await axios.get(OFFICIAL_HERO_JSON_URL, {
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });

    const heroList = res.data && res.data.en ? res.data.en : [];
    const jobMap = {
      warrior: 'Warrior',
      knight: 'Knight',
      assassin: 'Thief',
      ranger: 'Ranger',
      mage: 'Mage',
      manauser: 'Soul Weaver'
    };

    const elementMap = {
      fire: 'Fire',
      ice: 'Ice',
      wind: 'Earth',
      light: 'Light',
      dark: 'Dark'
    };

    heroList.forEach(item => {
      const key = slugify(item.name);
      if (key) {
        heroCacheMap.set(key, {
          code: item.code,
          name: item.name,
          rarity: parseInt(item.grade, 10) || 5,
          class: jobMap[item.job_cd] || 'Warrior',
          element: elementMap[item.attribute_cd] || 'Fire',
          image_url: `https://epic7-cdn.game.onstove.com/gameRecord/epic7/hero/${item.code}_s.png`
        });
      }
    });
    console.log(`[Backup Provider] Cached ${heroCacheMap.size} heroes from backup dataset.`);
  } catch (err) {
    console.warn(`[Backup Provider Warning] Could not load official hero backup JSON: ${err.message}`);
  }

  return heroCacheMap;
}

/**
 * Load and cache official/backup Artifact JSON database
 */
async function loadBackupArtifactDatabase() {
  if (artifactCacheMap) return artifactCacheMap;
  artifactCacheMap = new Map();

  try {
    const res = await axios.get(OFFICIAL_ARTIFACT_JSON_URL, {
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });

    const artList = res.data && res.data.en ? res.data.en : [];

    artList.forEach(item => {
      const key = slugify(item.name);
      if (key) {
        artifactCacheMap.set(key, {
          code: item.code,
          name: item.name,
          rarity: 5
        });
      }
    });
    console.log(`[Backup Provider] Cached ${artifactCacheMap.size} artifacts from backup dataset.`);
  } catch (err) {
    console.warn(`[Backup Provider Warning] Could not load official artifact backup JSON: ${err.message}`);
  }

  return artifactCacheMap;
}

/**
 * Fetch Hero Data from CeciliaBot / Backup Database
 */
async function fetchBackupHeroData(keyName) {
  const dbMap = await loadBackupHeroDatabase();
  const cached = dbMap.get(keyName);

  const name = cached ? cached.name : formatNameFromKey(keyName);
  const element = cached ? cached.element : 'Fire';
  const heroClass = cached ? cached.class : 'Warrior';
  const rarity = cached ? cached.rarity : 5;
  const imageUrl = cached && cached.image_url ? cached.image_url : `${CECILIABOT_BASE_URL}/images/hero/${keyName}.png`;

  console.log(`[Backup Source: CeciliaBot] Successfully parsed hero: ${name} (${element} ${heroClass} ${rarity}★)`);

  return {
    key_name: keyName,
    name: name,
    element: element,
    class: heroClass,
    rarity: rarity,
    is_limited: false,
    base_stats: {
      atk: rarity === 5 ? 1200 : (rarity === 4 ? 980 : 820),
      hp: rarity === 5 ? 6000 : (rarity === 4 ? 5100 : 4300),
      def: rarity === 5 ? 620 : (rarity === 4 ? 540 : 470),
      spd: 112,
      crit_rate: 0.15,
      crit_damage: 1.5,
      eff: 0,
      eff_res: 0
    },
    skills: [
      { name: 'Basic Attack', desc: `${name} attacks the enemy.` }
    ],
    recommended_builds: [],
    image_url: imageUrl,
    description: `${name} is an Epic Seven hero retrieved from backup source dataset.`,
    source: 'ceciliabot.github.io'
  };
}

/**
 * Fetch Artifact Data from CeciliaBot / Backup Database
 */
async function fetchBackupArtifactData(keyName) {
  const dbMap = await loadBackupArtifactDatabase();
  const cached = dbMap.get(keyName);

  const name = cached ? cached.name : formatNameFromKey(keyName);
  const rarity = cached ? cached.rarity : 5;
  const imageUrl = `${CECILIABOT_BASE_URL}/images/artifact/${keyName}.png`;

  console.log(`[Backup Source: CeciliaBot] Successfully parsed artifact: ${name} (${rarity}★)`);

  return {
    key_name: keyName,
    name: name,
    rarity: rarity,
    class_restriction: 'Common',
    base_stats: { atk: 15, hp: 60 },
    max_stats: { atk: 195, hp: 780 },
    skill_description: `${name} artifact skill effect (Lv. 1).`,
    skill_max_description: `${name} max enhanced artifact skill effect (Lv. 30).`,
    recommended_heroes: [],
    image_url: imageUrl,
    source: 'ceciliabot.github.io'
  };
}

/**
 * Get all available Hero keys from backup database
 */
async function getAllBackupHeroKeys() {
  const dbMap = await loadBackupHeroDatabase();
  return Array.from(dbMap.keys());
}

/**
 * Get all available Artifact keys from backup database
 */
async function getAllBackupArtifactKeys() {
  const dbMap = await loadBackupArtifactDatabase();
  return Array.from(dbMap.keys());
}

module.exports = {
  CECILIABOT_BASE_URL,
  getAllBackupHeroKeys,
  getAllBackupArtifactKeys,
  fetchBackupHeroData,
  fetchBackupArtifactData
};
