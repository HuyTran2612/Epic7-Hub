# Phase 5: Personal Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement advanced personal features including Personal Tier List, Hero Comparison, Backup & Restore (JSON Export/Import), and Personal Collection Statistics.

**Architecture:** Extended REST APIs in Express backend + new frontend modules (`tierlist.js`, `compare.js`, `backup.js`, `stats.js`) integrated into main SPA header navigation.

**Tech Stack:** Express, MySQL2, Node.js, Vanilla JS Modules, CSS variables.

## Global Constraints
- Target directory: `backend/src/` and `frontend/js/`
- Endpoint prefixes: `/api/tierlist`, `/api/compare`, `/api/stats`, `/api/backup`

---

### Task 5.1: Tier List & Stats Backend APIs

**Files:**
- Create: `backend/src/controllers/tierlistController.js`
- Create: `backend/src/routes/tierlist.js`
- Create: `backend/src/controllers/statsController.js`
- Create: `backend/src/routes/stats.js`
- Create: `backend/src/controllers/backupController.js`
- Create: `backend/src/routes/backup.js`
- Modify: `backend/src/app.js`

**Steps:**
- [ ] **Step 1: Write `tierlistController.js` and `statsController.js`**
  Implement grouping heroes by personal tier (S, A, B, C, D) and statistical aggregation queries (hero count by element, class, rarity, collection ownership rate).

- [ ] **Step 2: Write `backupController.js` for Export & Import**
  Implement `GET /api/backup/export` (dump notes and collection as JSON file) and `POST /api/backup/import` (restore notes and collection from JSON payload).

- [ ] **Step 3: Register routes in `backend/src/app.js`**

- [ ] **Step 4: Verification**
  Write automated tests in `backend/tests/phase5.test.js` and verify all endpoints return 200 OK.

---

### Task 5.2: Frontend Personal Features Modules

**Files:**
- Create: `frontend/js/tierlist.js`
- Create: `frontend/js/compare.js`
- Create: `frontend/js/backup.js`
- Create: `frontend/js/stats.js`
- Modify: `frontend/js/api.js`
- Modify: `frontend/index.html`
- Modify: `frontend/js/app.js`

**Steps:**
- [ ] **Step 1: Write API helpers in `frontend/js/api.js`**
  Add `fetchTierList`, `fetchStats`, `exportBackup`, `importBackup`.

- [ ] **Step 2: Write `tierlist.js`, `compare.js`, `backup.js`, `stats.js`**
  Implement Tier List board, Hero Comparison side-by-side view, Backup Export/Import dropzone, and Personal Statistics charts.

- [ ] **Step 3: Update `frontend/index.html` & `frontend/js/app.js`**
  Add nav buttons for Tier List, Compare, Stats, Backup.

---

### Task 5.3: Phase 5 Verification & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`
- Create: `docs/verification/phase5-evidence.md`

**Steps:**
- [ ] **Step 1: Run complete test suite (`npm test`)**
- [ ] **Step 2: Record evidence log in `docs/verification/phase5-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md` to indicate Phase 5 completion**
