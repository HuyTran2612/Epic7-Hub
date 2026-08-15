# E7 Codex Artwork Archive & Triple-Source Failover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate E7 Codex high-definition artwork archives (full body poses & illustrations) and build a Triple-Source image failover pipeline for Epic7-Hub.

**Architecture:** Extend backend sync scrapers to discover E7 Codex asset paths (`e7codex-backup.js`), add `full_artwork_url` columns to MySQL schema, update sync pipelines, and render high-resolution pose galleries in frontend Hero/Artifact detail views.

**Tech Stack:** Node.js, Express, MySQL 8.0, Axios, Vanilla HTML5/CSS3.

## Global Constraints
- Naming convention: Canonical slugified keys via `slugify(name)`.
- Test runner: `node --test backend/tests/*.test.js`.
- Image Failover Priority: Priority 1 (epic7db WebP), Priority 2 (e7codex HD asset), Priority 3 (Dark Obsidian SVG Placeholder).

---

### Task 1: Database Migration & Schema Update

**Files:**
- Modify: `database/schema.sql:20-50`
- Create: `scratch/migrate-e7codex.js`

**Interfaces:**
- Consumes: MySQL connection pool `backend/src/config/db.js`
- Produces: `full_artwork_url` column in `heroes` and `artifacts` tables

- [ ] **Step 1: Write migration script in `scratch/migrate-e7codex.js`**

```javascript
const pool = require('../backend/src/config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE heroes ADD COLUMN full_artwork_url VARCHAR(500) NULL AFTER image_url;
    `).catch(e => console.log('heroes.full_artwork_url already exists or:', e.message));

    await pool.query(`
      ALTER TABLE artifacts ADD COLUMN full_artwork_url VARCHAR(500) NULL AFTER image_url;
    `).catch(e => console.log('artifacts.full_artwork_url already exists or:', e.message));

    console.log('Migration successful.');
  } finally {
    await pool.end();
  }
}

migrate();
```

- [ ] **Step 2: Run migration script**

Run: `node scratch/migrate-e7codex.js`  
Expected: "Migration successful."

- [ ] **Step 3: Update `database/schema.sql` definition**

```sql
ALTER TABLE heroes ADD COLUMN full_artwork_url VARCHAR(500) NULL AFTER image_url;
ALTER TABLE artifacts ADD COLUMN full_artwork_url VARCHAR(500) NULL AFTER image_url;
```

- [ ] **Step 4: Commit**

```bash
git add database/schema.sql scratch/migrate-e7codex.js
git commit -m "db: add full_artwork_url columns for heroes and artifacts"
```

---

### Task 2: Create E7 Codex Backup Provider (`backend/scripts/e7codex-backup.js`)

**Files:**
- Create: `backend/scripts/e7codex-backup.js`
- Create: `backend/tests/e7codex.test.js`

**Interfaces:**
- Consumes: `https://e7codex.com/data/units.json` & `https://e7codex.com/data/artifacts.json`
- Produces: `getE7CodexHeroArtwork(keyName)`, `getE7CodexArtifactArtwork(keyName)`

- [ ] **Step 1: Write failing test in `backend/tests/e7codex.test.js`**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { getE7CodexHeroArtwork, getE7CodexArtifactArtwork } = require('../scripts/e7codex-backup');

test('E7 Codex Data Provider - Hero and Artifact Artwork Discovery', async () => {
  const heroArt = await getE7CodexHeroArtwork('tamarinne');
  assert.ok(heroArt, 'Expected hero artwork for tamarinne');
  assert.ok(heroArt.includes('e7codex.com/assets/c1067/pose.png'), `Got: ${heroArt}`);

  const artArt = await getE7CodexArtifactArtwork('3f');
  assert.ok(artArt, 'Expected artifact artwork for 3f');
  assert.ok(artArt.includes('e7codex.com/assets/_artifacts/art0193_fu.png'), `Got: ${artArt}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/e7codex.test.js`  
Expected: FAIL with "Cannot find module '../scripts/e7codex-backup'"

- [ ] **Step 3: Implement `backend/scripts/e7codex-backup.js`**

```javascript
const axios = require('axios');

const E7CODEX_BASE_URL = 'https://e7codex.com';
const E7CODEX_UNITS_URL = 'https://e7codex.com/data/units.json';
const E7CODEX_ARTIFACTS_URL = 'https://e7codex.com/data/artifacts.json';

let unitCacheMap = null;
let artifactCacheMap = null;

function slugify(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function loadE7CodexUnits() {
  if (unitCacheMap) return unitCacheMap;
  unitCacheMap = new Map();

  try {
    const res = await axios.get(E7CODEX_UNITS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const list = Array.isArray(res.data) ? res.data : [];
    list.forEach(item => {
      const slugKey = item.slug || item.hero_slug || slugify(item.name || item.hero_name);
      if (slugKey && item.pose && !unitCacheMap.has(slugKey)) {
        unitCacheMap.set(slugKey, `${E7CODEX_BASE_URL}/${item.pose}`);
      }
    });
  } catch (e) {
    console.warn(`[E7Codex Provider Warning] Could not load units.json: ${e.message}`);
  }

  return unitCacheMap;
}

async function loadE7CodexArtifacts() {
  if (artifactCacheMap) return artifactCacheMap;
  artifactCacheMap = new Map();

  try {
    const res = await axios.get(E7CODEX_ARTIFACTS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const list = Array.isArray(res.data) ? res.data : [];
    list.forEach(item => {
      const slugKey = item.slug || slugify(item.name);
      if (slugKey && item.art_full && !artifactCacheMap.has(slugKey)) {
        artifactCacheMap.set(slugKey, `${E7CODEX_BASE_URL}/${item.art_full}`);
      }
    });
  } catch (e) {
    console.warn(`[E7Codex Provider Warning] Could not load artifacts.json: ${e.message}`);
  }

  return artifactCacheMap;
}

async function getE7CodexHeroArtwork(keyName) {
  const map = await loadE7CodexUnits();
  return map.get(keyName) || null;
}

async function getE7CodexArtifactArtwork(keyName) {
  const map = await loadE7CodexArtifacts();
  return map.get(keyName) || null;
}

module.exports = {
  getE7CodexHeroArtwork,
  getE7CodexArtifactArtwork
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS all 20 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/e7codex-backup.js backend/tests/e7codex.test.js
git commit -m "feat: add E7 Codex backup artwork provider and unit test"
```

---

### Task 3: Update Sync Pipelines & Enrich Database (`sync-heroes.js` & `sync-artifacts.js`)

**Files:**
- Modify: `backend/scripts/sync-heroes.js:50-135`
- Modify: `backend/scripts/sync-artifacts.js:50-135`

**Interfaces:**
- Consumes: `getE7CodexHeroArtwork(key_name)` and `getE7CodexArtifactArtwork(key_name)`
- Produces: Saved `full_artwork_url` in MySQL database `heroes` and `artifacts`

- [ ] **Step 1: Update `sync-heroes.js` to enrich `full_artwork_url`**

Import `getE7CodexHeroArtwork` from `./e7codex-backup.js` and include `full_artwork_url` in SQL INSERT & UPDATE statement.

```javascript
const { getE7CodexHeroArtwork } = require('./e7codex-backup');

// In sync loop:
const fullArtworkUrl = await getE7CodexHeroArtwork(key_name);
hero.full_artwork_url = fullArtworkUrl || hero.image_url;
```

- [ ] **Step 2: Update `sync-artifacts.js` to enrich `full_artwork_url`**

Import `getE7CodexArtifactArtwork` from `./e7codex-backup.js` and include `full_artwork_url` in SQL INSERT & UPDATE statement.

```javascript
const { getE7CodexArtifactArtwork } = require('./e7codex-backup');

// In sync loop:
const fullArtworkUrl = await getE7CodexArtifactArtwork(key_name);
artifact.full_artwork_url = fullArtworkUrl || artifact.image_url;
```

- [ ] **Step 3: Run Full Sync**

Run: `npm run sync`  
Expected: Full sync completes successfully, populating `full_artwork_url` in MySQL DB.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/sync-heroes.js backend/scripts/sync-artifacts.js
git commit -m "feat: enrich full_artwork_url in hero and artifact sync pipelines"
```

---

### Task 4: Frontend UI HD Artwork Gallery & Lightbox Preview (`hero-detail.js` & `artifact-detail.js`)

**Files:**
- Modify: `frontend/js/hero-detail.js:45-120` & `200-280`
- Modify: `frontend/js/artifact-detail.js:35-80` & `120-165`

**Interfaces:**
- Consumes: `hero.full_artwork_url` and `art.full_artwork_url`
- Produces: HD Artwork Gallery Card & Full-Screen Image Lightbox Preview

- [ ] **Step 1: Add High-Res Artwork section in `hero-detail.js`**

In `openHeroModal` and `renderHeroDetailView`, add:

```html
<!-- High-Res Full Body Artwork Gallery -->
${hero.full_artwork_url ? `
  <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">🎨 High-Res Pose Artwork</h3>
  <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; text-align:center;">
    <img src="${hero.full_artwork_url}" alt="${hero.name} Full Artwork" style="max-height:450px; max-width:100%; object-fit:contain; border-radius:var(--radius-sm); filter:drop-shadow(0 10px 20px rgba(0,0,0,0.8));" onerror="this.style.display='none';">
  </div>
` : ''}
```

- [ ] **Step 2: Add High-Res Illustration section in `artifact-detail.js`**

In `openArtifactModal` and `renderArtifactDetailView`, add:

```html
<!-- High-Res Artifact Illustration -->
${art.full_artwork_url ? `
  <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">🎨 High-Res Artifact Illustration</h3>
  <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; text-align:center;">
    <img src="${art.full_artwork_url}" alt="${art.name} Full Illustration" style="max-height:400px; max-width:100%; object-fit:contain; border-radius:var(--radius-sm); filter:drop-shadow(0 10px 20px rgba(0,0,0,0.8));" onerror="this.style.display='none';">
  </div>
` : ''}
```

- [ ] **Step 3: Run full automated tests**

Run: `npm test`  
Expected: PASS all 20 tests.

- [ ] **Step 4: Commit**

```bash
git add frontend/js/hero-detail.js frontend/js/artifact-detail.js
git commit -m "feat: render high-res E7 Codex pose artwork gallery in detail views"
```

---
