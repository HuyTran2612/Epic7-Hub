# Phase 0: Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 0 environment preparation, repository initialization, folder structure setup, package installation, `.env` configuration, and database creation.

**Architecture:** Node.js project root with `backend`, `frontend`, `database`, `docs` structure.

**Tech Stack:** Node.js, Express, MySQL 8.0, axios, cheerio, dotenv, cors, nodemon.

## Global Constraints
- Node.js version >= 18 (installed: v24.16.0)
- MySQL version 8.0 (service: MySQL80 running)
- Project directory: `d:\Work\Code\Dự án Cá Nhân\Epic7-Hub`

---

### Task 0.1: Git Repository Initialization & `.gitignore`

**Files:**
- Create: `.gitignore`

**Steps:**
- [ ] **Step 1: Initialize git repository**
  Run: `git init`
  Expected: Initialized empty Git repository.

- [ ] **Step 2: Create `.gitignore`**
  Add standard Node.js & environment ignore patterns:
  `node_modules/`, `.env`, `*.log`, `.DS_Store`

- [ ] **Step 3: Verification**
  Run: `git status`

---

### Task 0.2: Package Initialization & Dependencies Installation

**Files:**
- Create: `package.json`

**Steps:**
- [ ] **Step 1: Initialize package.json**
  Run: `npm init -y`

- [ ] **Step 2: Install dependencies**
  Run: `npm install express mysql2 dotenv cors axios cheerio`

- [ ] **Step 3: Install dev dependencies**
  Run: `npm install -D nodemon`

- [ ] **Step 4: Verification**
  Check `package.json` and verify dependencies exist.

---

### Task 0.3: Folder Structure Creation

**Files:**
- Directories: `backend/src/config`, `backend/src/routes`, `backend/src/controllers`, `backend/src/services`, `backend/scripts`, `frontend/css`, `frontend/js`, `frontend/assets`, `database`

**Steps:**
- [ ] **Step 1: Create all required directories**
  Run PowerShell commands to create directory tree.

- [ ] **Step 2: Verification**
  Run directory check to confirm folders exist.

---

### Task 0.4: Environment Configuration

**Files:**
- Create: `.env.example`
- Create: `.env`

**Steps:**
- [ ] **Step 1: Create `.env.example`**
  Add template DB credentials and PORT.

- [ ] **Step 2: Create `.env`**
  Add actual local DB configuration.

- [ ] **Step 3: Verification**
  Ensure `.env` exists and is excluded by `.gitignore`.

---

### Task 0.5: MySQL Database Creation (`epic7_personal`)

**Files:**
- Database: `epic7_personal`

**Steps:**
- [ ] **Step 1: Create database `epic7_personal` in MySQL**
  Execute SQL command via `mysql.exe`: `CREATE DATABASE IF NOT EXISTS epic7_personal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

- [ ] **Step 2: Verification**
  Execute SQL command `SHOW DATABASES;` to verify `epic7_personal` exists.

---

### Task 0.6: Phase 0 Verification & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`

**Steps:**
- [ ] **Step 1: Run complete Phase 0 verification**
- [ ] **Step 2: Record evidence in `docs/verification/phase0-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md` to indicate Phase 0 completion**
