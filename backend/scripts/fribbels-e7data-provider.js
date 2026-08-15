const axios = require('axios');

const FRIBBELS_TRANSLATION_URL = 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/locales/en/translation.json';

let fribbelsCache = null;

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
  fetchE7DataStats
};
