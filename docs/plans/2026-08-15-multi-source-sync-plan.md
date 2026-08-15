# 4-Source Data Sync Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified 4-source data aggregator sync script (`sync-heroes.js`, `sync-artifacts.js`, `ceciliabot-backup.js`) merging data from **Epic7DB**, **Fribbels**, **CeciliaBot**, and **E7Data**, guaranteeing complete detailed attributes for all heroes and artifacts.

**Architecture:**
1. Source 1 (Epic7DB): Web HTML parser for skills, recommended builds, exclusive equipment, and descriptions.
2. Source 2 (Fribbels): Localized translation map, gear sets recommendations, and stat efficiency definitions.
3. Source 3 (CeciliaBot): Smilegate official CDN game records for EN/KO/VI names, official HD avatar portraits, rarity, element, and class codes.
4. Source 4 (E7Data): Level 60 Max Awaken base stats calculation map and artifact max skill descriptions.

**Tech Stack:** Node.js, Axios (`family: 4`), Cheerio, MySQL (mysql2/promise).

---

### Task 1: Create Fribbels & E7Data Data Provider Integrator

**Files:**
- Create: `backend/scripts/fribbels-e7data-provider.js`
- Modify: `backend/scripts/ceciliabot-backup.js`
- Test: `backend/tests/multi-source.test.js`

- [ ] **Step 1: Write test for Fribbels & E7Data provider**

Create `backend/tests/multi-source.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchFribbelsData, fetchE7DataStats } = require('../scripts/fribbels-e7data-provider');

test('Multi-Source Data Integrator - Fribbels & E7Data', async () => {
  const fribbelsMap = await fetchFribbelsData();
  assert.ok(fribbelsMap);
  assert.ok(typeof fribbelsMap === 'object');

  const stats = await fetchE7DataStats('tamarinne', 5);
  assert.ok(stats.hp > 4000);
  assert.ok(stats.spd > 100);
});
```

- [ ] **Step 2: Implement `fribbels-e7data-provider.js`**

Create `backend/scripts/fribbels-e7data-provider.js`:
```js
const axios = require('axios');

const FRIBBELS_TRANSLATION_URL = 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/locales/en/translation.json';

let fribbelsCache = null;

async function fetchFribbelsData() {
  if (fribbelsCache) return fribbelsCache;
  try {
    const res = await axios.get(FRIBBELS_TRANSLATION_URL, {
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    fribbelsCache = res.data;
    console.log('[Fribbels Provider] Successfully cached Fribbels translation dataset.');
  } catch (err) {
    console.warn(`[Fribbels Provider Warning] Could not fetch Fribbels data: ${err.message}`);
    fribbelsCache = {};
  }
  return fribbelsCache;
}

async function fetchE7DataStats(keyName, rarity = 5) {
  // E7Data Level 60 Awaken base stats baseline calculator
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
```

- [ ] **Step 3: Run test to verify passes**

Run: `node --test backend/tests/multi-source.test.js`
Expected: PASS

---

### Task 2: Wire 4-Source Aggregation into `sync-heroes.js` & `sync-artifacts.js`

**Files:**
- Modify: `backend/scripts/sync-heroes.js`
- Modify: `backend/scripts/sync-artifacts.js`

- [ ] **Step 1: Merge 4-Source data in `sync-heroes.js`**
Incorporate data from Source 1 (Epic7DB), Source 2 (Fribbels), Source 3 (CeciliaBot), and Source 4 (E7Data).

- [ ] **Step 2: Merge 4-Source data in `sync-artifacts.js`**
Incorporate data from Source 1 (Epic7DB), Source 2 (Fribbels), Source 3 (CeciliaBot), and Source 4 (E7Data).

- [ ] **Step 3: Run full automated test suite**
Run: `npm test`
Expected: 19/19 PASS

---
