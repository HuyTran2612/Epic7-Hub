# Dual-Source Concurrent Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable `npm run sync` (`full-sync.js`, `sync-heroes.js`, `sync-artifacts.js`) to concurrently discover, fetch, and merge hero & artifact data from BOTH primary source (`epic7db.com`) and secondary source (`ceciliabot.github.io` / official dataset), guaranteeing zero missing data.

**Architecture:** 
1. `ceciliabot-backup.js` will export `getAllBackupHeroKeys()`, `getAllBackupArtifactKeys()`, `fetchBackupHeroData(key)`, and `fetchBackupArtifactData(key)`.
2. `sync-heroes.js` & `sync-artifacts.js` will combine key lists from both sources (`Set([...sourceAKeys, ...sourceBKeys])`).
3. For each item key, data will be merged: primary details enriched with secondary details (fallback stats, element, class, rarity, and high-res image URLs).

**Tech Stack:** Node.js, Axios (IPv4 `family: 4`), Cheerio, MySQL (mysql2/promise).

---

### Task 1: Extend `ceciliabot-backup.js` with Full Key Discovery Functions

**Files:**
- Modify: `backend/scripts/ceciliabot-backup.js`
- Test: `backend/tests/sync-backup.test.js`

- [ ] **Step 1: Write unit test for key discovery functions**

Create `backend/tests/sync-backup.test.js`:
```js
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
```

- [ ] **Step 2: Implement key discovery functions in `ceciliabot-backup.js`**

Add `getAllBackupHeroKeys()` and `getAllBackupArtifactKeys()` exports to `backend/scripts/ceciliabot-backup.js`:
```js
async function getAllBackupHeroKeys() {
  const dbMap = await loadBackupHeroDatabase();
  return Array.from(dbMap.keys());
}

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
```

- [ ] **Step 3: Run test to verify key discovery passes**

Run: `node --test backend/tests/sync-backup.test.js`
Expected: PASS

---

### Task 2: Update `sync-heroes.js` & `sync-artifacts.js` for Dual-Source Key Discovery & Merging

**Files:**
- Modify: `backend/scripts/sync-heroes.js`
- Modify: `backend/scripts/sync-artifacts.js`

- [ ] **Step 1: Update `sync-heroes.js` to discover keys from both sources and merge fields**

In `sync-heroes.js`:
```js
const { getAllBackupHeroKeys, fetchBackupHeroData } = require('./ceciliabot-backup');
```
Combine keys:
```js
const backupHeroKeys = await getAllBackupHeroKeys();
const allTargetKeys = [...new Set([...uniquePrimaryKeys, ...backupHeroKeys])];
```
For each key, try primary fetch; if primary fails or is missing stats/element, merge with `fetchBackupHeroData(key)`.

- [ ] **Step 2: Update `sync-artifacts.js` to discover keys from both sources and merge fields**

In `sync-artifacts.js`:
```js
const { getAllBackupArtifactKeys, fetchBackupArtifactData } = require('./ceciliabot-backup');
```
Combine keys:
```js
const backupArtKeys = await getAllBackupArtifactKeys();
const allTargetKeys = [...new Set([...uniquePrimaryKeys, ...backupArtKeys])];
```

- [ ] **Step 3: Run full automated test suite to ensure sync and endpoints PASS**

Run: `npm test`
Expected: 17/17 PASS

---
