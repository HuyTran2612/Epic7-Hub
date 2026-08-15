const axios = require('axios');

const FRIBBELS_TRANSLATION_URL = 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/locales/en/translation.json';
const FRIBBELS_ARTIFACT_DATA_URL = 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cache/artifactdata.json';

let fribbelsCache = null;
let fribbelsArtifactCache = null;

// Fribbels role names -> Epic Seven canonical class names
const ROLE_TO_CLASS = {
  warrior: 'Warrior',
  knight: 'Knight',
  assassin: 'Thief',    // Fribbels calls Thieves "assassin"
  ranger: 'Ranger',
  mage: 'Mage',
  manauser: 'Soul Weaver',  // Fribbels calls Soul Weavers "manauser"
  '': 'Common'
};

/**
 * Fetch Fribbels E7 Optimizer locale and build translation data
 */
async function fetchFribbelsData() {
  if (fribbelsCache) return fribbelsCache;
  try {
    const res = await axios.get(FRIBBELS_TRANSLATION_URL, {
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    fribbelsCache = res.data;
    console.log('[Fribbels Provider] Successfully cached Fribbels dataset.');
  } catch (err) {
    console.warn(`[Fribbels Provider Warning] Could not fetch Fribbels data: ${err.message}`);
    fribbelsCache = {};
  }
  return fribbelsCache;
}

/**
 * Fetch Fribbels artifact data (includes role/class restriction per artifact)
 * Returns a Map<name -> { role, class_restriction, code, rarity, stats }>
 */
async function fetchFribbelsArtifacts() {
  if (fribbelsArtifactCache) return fribbelsArtifactCache;
  try {
    const res = await axios.get(FRIBBELS_ARTIFACT_DATA_URL, {
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const raw = res.data;
    const arr = Array.isArray(raw) ? raw : Object.values(raw);

    // Build lookup map: lowercase name -> artifact info
    fribbelsArtifactCache = new Map();
    arr.forEach(a => {
      if (!a.name) return;
      const classRestriction = ROLE_TO_CLASS[a.role] || 'Common';
      fribbelsArtifactCache.set(a.name.toLowerCase(), {
        name: a.name,
        code: a.code,
        rarity: a.rarity,
        role: a.role,
        class_restriction: classRestriction,
        base_stats: {
          atk: a.stats ? a.stats.attack : 15,
          hp: a.stats ? a.stats.health : 60,
          def: a.stats ? a.stats.defense : 0
        }
      });
    });
    console.log(`[Fribbels Provider] Loaded ${fribbelsArtifactCache.size} artifacts with class restrictions.`);
  } catch (err) {
    console.warn(`[Fribbels Provider Warning] Could not fetch artifact data: ${err.message}`);
    fribbelsArtifactCache = new Map();
  }
  return fribbelsArtifactCache;
}

/**
 * Fetch E7Data Level 60 Max Awaken base stats baseline
 */
async function fetchE7DataStats(keyName, rarity = 5) {
  return {
    atk: rarity === 5 ? 1228 : (rarity === 4 ? 994 : 832),
    hp: rarity === 5 ? 6034 : (rarity === 4 ? 5138 : 4370),
    def: rarity === 5 ? 625 : (rarity === 4 ? 543 : 473),
    spd: 112,
    crit_rate: 0.15,
    crit_damage: 1.50,
    eff: 0,
    eff_res: 0
  };
}

module.exports = {
  fetchFribbelsData,
  fetchFribbelsArtifacts,
  fetchE7DataStats,
  ROLE_TO_CLASS
};
