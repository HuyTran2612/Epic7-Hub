# Phase 2: Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and test complete RESTful Backend API using Express and MySQL2 for Heroes, Artifacts, Personal Notes, and Collection management.

**Architecture:** Express MVC structure with decoupled controllers, routes, connection pool configuration, and error-handling middleware.

**Tech Stack:** Express, mysql2/promise, dotenv, cors, supertest (for API endpoint testing).

## Global Constraints
- Database: `epic7_personal`
- Response format: JSON with standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

---

### Task 2.1: MySQL Connection Pool & Base Server Express App

**Files:**
- Create: `backend/src/config/db.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Test: `backend/tests/db.test.js`

**Steps:**
- [ ] **Step 1: Write DB connection pool module `backend/src/config/db.js`**
  Export `mysql2/promise` pool configured from `process.env`.

- [ ] **Step 2: Write Express application `backend/src/app.js` and entrypoint `backend/src/server.js`**
  Configure middleware (`cors`, `express.json()`), root route (`GET /`), and error middleware.

- [ ] **Step 3: Test DB connection & server initialization**
  Run test script to verify app starts and connects to MySQL pool.

---

### Task 2.2: Heroes API (`GET /api/heroes`, `GET /api/heroes/:key`, `GET /api/heroes/:key/recommendations`)

**Files:**
- Create: `backend/src/controllers/heroesController.js`
- Create: `backend/src/routes/heroes.js`
- Test: `backend/tests/heroes.test.js`

**Steps:**
- [ ] **Step 1: Write Heroes controller & routes**
  Implement list filtering (element, class, rarity, search, pagination), single item detail by `key_name`, and artifact recommendations for a hero.

- [ ] **Step 2: Write unit/integration tests for Heroes endpoints**
  Verify list, pagination, detail, recommendations, and 404 response for invalid key.

- [ ] **Step 3: Run tests to verify PASS**

---

### Task 2.3: Artifacts API (`GET /api/artifacts`, `GET /api/artifacts/:key`)

**Files:**
- Create: `backend/src/controllers/artifactsController.js`
- Create: `backend/src/routes/artifacts.js`
- Test: `backend/tests/artifacts.test.js`

**Steps:**
- [ ] **Step 1: Write Artifacts controller & routes**
  Implement list filtering (rarity, class_restriction, search, pagination) and single item detail by `key_name`.

- [ ] **Step 2: Write tests for Artifacts endpoints**

- [ ] **Step 3: Run tests to verify PASS**

---

### Task 2.4: User Notes API (`GET`, `POST`, `PUT`, `DELETE /api/notes`)

**Files:**
- Create: `backend/src/controllers/notesController.js`
- Create: `backend/src/routes/notes.js`
- Test: `backend/tests/notes.test.js`

**Steps:**
- [ ] **Step 1: Write Notes controller & routes**
  Implement CRUD operations for personal notes linked to hero/artifact targets.

- [ ] **Step 2: Write tests for Notes endpoints**

- [ ] **Step 3: Run tests to verify PASS**

---

### Task 2.5: Collection API (`GET`, `POST`, `PUT`, `DELETE /api/collection`)

**Files:**
- Create: `backend/src/controllers/collectionController.js`
- Create: `backend/src/routes/collection.js`
- Test: `backend/tests/collection.test.js`

**Steps:**
- [ ] **Step 1: Write Collection controller & routes**
  Implement CRUD operations for user collection status (`owned`, `wishlist`, `building`).

- [ ] **Step 2: Write tests for Collection endpoints**

- [ ] **Step 3: Run tests to verify PASS**

---

### Task 2.6: Phase 2 Comprehensive Test & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`
- Create: `docs/verification/phase2-evidence.md`

**Steps:**
- [ ] **Step 1: Run full test suite covering all APIs**
- [ ] **Step 2: Record evidence log in `docs/verification/phase2-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md` to indicate Phase 2 completion**
