# Phase 3: Scraper / Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement safe, rate-limited data scraper and sync scripts (`sync-heroes.js`, `sync-artifacts.js`, `full-sync.js`) for epic7db.com with logging to `sync_logs` table.

**Architecture:** Node.js cheerio & axios parser pipeline with rate limiting (1.5s delay), upsert logic (`ON DUPLICATE KEY UPDATE`), error handling, and audit logging to MySQL.

**Tech Stack:** Node.js, axios, cheerio, mysql2.

## Global Constraints
- Rate limiting: Minimum 1.5s delay between requests
- Fixture/sample test limit: 5 heroes / 5 artifacts default per run
- Logging: Log every sync run to `sync_logs` table in MySQL

---

### Task 3.1: Parser Module Unit & Integration Tests

**Files:**
- Create: `backend/scripts/parser.js`
- Create: `backend/tests/parser.test.js`

**Steps:**
- [ ] **Step 1: Write parser unit tests `backend/tests/parser.test.js`**
  Verify HTML parsing for hero stats, skills, element, class, rarity, and artifact stats/descriptions.

- [ ] **Step 2: Run parser test suite**
  `node --test backend/tests/parser.test.js`

---

### Task 3.2: Hero & Artifact Sync Execution

**Files:**
- Create: `backend/scripts/sync-heroes.js`
- Create: `backend/scripts/sync-artifacts.js`
- Create: `backend/scripts/full-sync.js`

**Steps:**
- [ ] **Step 1: Execute sample hero sync script**
  `npm run sync:heroes`

- [ ] **Step 2: Execute sample artifact sync script**
  `npm run sync:artifacts`

- [ ] **Step 3: Execute full sync pipeline**
  `npm run sync`

- [ ] **Step 4: Verification**
  Check `sync_logs` table in MySQL to verify success logs and records affected.

---

### Task 3.3: Phase 3 Verification & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`
- Create: `docs/verification/phase3-evidence.md`

**Steps:**
- [ ] **Step 1: Run parser unit tests and sync verification script**
- [ ] **Step 2: Record evidence in `docs/verification/phase3-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md` to indicate Phase 3 completion**
