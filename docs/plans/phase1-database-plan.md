# Phase 1: Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create MySQL schema `database/schema.sql`, execute it on `epic7_personal`, create seed data script `database/seed.sql`, execute seed data, and verify DB structure.

**Architecture:** Relational database with JSON fields for dynamic game attributes (stats, skills, builds) and relational tables for user collection, notes, and recommendations.

**Tech Stack:** MySQL 8.0, SQL scripts, Node.js mysql2 verification.

## Global Constraints
- Database: `epic7_personal`
- Tables: `heroes`, `artifacts`, `hero_artifact_recommendations`, `user_notes`, `collection`, `sync_logs`

---

### Task 1.1: Create `database/schema.sql`

**Files:**
- Create: `database/schema.sql`

**Steps:**
- [ ] **Step 1: Write `database/schema.sql`**
  Create full table definitions with constraints, foreign keys, indexes, and utf8mb4 collation.

- [ ] **Step 2: Execute schema on MySQL**
  Run `mysql.exe` to execute `database/schema.sql`.

- [ ] **Step 3: Verification**
  Query `SHOW TABLES;` to verify all 6 tables exist.

---

### Task 1.2: Create `database/seed.sql`

**Files:**
- Create: `database/seed.sql`

**Steps:**
- [ ] **Step 1: Write `database/seed.sql`**
  Insert sample heroes (e.g. Arbiter Vildred, Tamarinne, Brieg), artifacts (e.g. Alexa's Basket, Daydream Joker), user notes, collection items, and recommendations.

- [ ] **Step 2: Execute seed script on MySQL**
  Run `mysql.exe` to execute `database/seed.sql`.

- [ ] **Step 3: Verification**
  Query counts from `heroes`, `artifacts`, `hero_artifact_recommendations`, `user_notes`, `collection`.

---

### Task 1.3: Phase 1 Verification & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`
- Create: `docs/verification/phase1-evidence.md`

**Steps:**
- [ ] **Step 1: Run Node.js verification script to test schema & foreign key constraints**
- [ ] **Step 2: Record evidence in `docs/verification/phase1-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md`**
