# Phase 4: Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-mode, responsive SPA frontend for Epic7-Hub connecting directly to Backend REST APIs.

**Architecture:** Vanilla HTML5, CSS3 Custom Properties (Design System tokens), modular JavaScript ES Modules (`api.js`, `app.js`, `heroes.js`, `artifacts.js`, `collection.js`).

**Tech Stack:** HTML5, Vanilla CSS, JavaScript ES Modules, Google Fonts (Outfit & Inter), FontAwesome / Feather SVG icons.

## Global Constraints
- Target directory: `frontend/`
- Standard static entrypoint: `frontend/index.html`
- Express static serving: Configure Express `app.use(express.static('frontend'))` so app runs on single port `http://localhost:3000`.

---

### Task 4.1: CSS Design System & Layout Foundation

**Files:**
- Create: `frontend/css/style.css`
- Modify: `backend/src/app.js` (serve static frontend files)

**Steps:**
- [ ] **Step 1: Write `frontend/css/style.css`**
  Implement CSS variables for colors (Obsidian dark, Element accents, Rarity gold), typography, glassmorphism cards, responsive grid system, modal overlays, badge styles, and smooth transitions.

- [ ] **Step 2: Serve `frontend` directory via Express `backend/src/app.js`**
  Add `app.use(express.static(path.join(__dirname, '../../frontend')))` to serve static files.

- [ ] **Step 3: Verification**
  Access `http://localhost:3000` via curl / HTTP test.

---

### Task 4.2: HTML Page Structure & API Client (`frontend/js/api.js`)

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/js/api.js`

**Steps:**
- [ ] **Step 1: Write `frontend/js/api.js`**
  Encapsulate fetch calls for `/api/heroes`, `/api/artifacts`, `/api/notes`, `/api/collection`, and `/api/health`.

- [ ] **Step 2: Write `frontend/index.html`**
  Build main SPA container: Header Navigation Bar, Dashboard Section, Heroes Grid/Table View, Artifacts View, Collection View, and Hero Detail Modal.

---

### Task 4.3: Heroes & Detail Modal Component (`frontend/js/heroes.js`)

**Files:**
- Create: `frontend/js/heroes.js`

**Steps:**
- [ ] **Step 1: Write `frontend/js/heroes.js`**
  Implement hero grid rendering, element/class/rarity filter handlers, search debounce, pagination controls, and Hero Detail Modal with personal notes & collection toggles.

- [ ] **Step 2: Verification**
  Test hero filtering and modal rendering.

---

### Task 4.4: Artifacts & Collection Views (`frontend/js/artifacts.js`, `frontend/js/collection.js`, `frontend/js/app.js`)

**Files:**
- Create: `frontend/js/artifacts.js`
- Create: `frontend/js/collection.js`
- Create: `frontend/js/app.js`

**Steps:**
- [ ] **Step 1: Write `frontend/js/artifacts.js`**
  Render artifacts grid, rarity filters, search.

- [ ] **Step 2: Write `frontend/js/collection.js`**
  Render owned & wishlist items with quick status updates.

- [ ] **Step 3: Write `frontend/js/app.js`**
  Main entrypoint orchestrating navigation tabs, stats counter, keyboard shortcuts (`/` or `Ctrl+K`), and initial data loading.

---

### Task 4.5: Phase 4 Verification & State Update

**Files:**
- Modify: `plan.md`
- Modify: `docs/PLAN-STATE.md`
- Create: `docs/verification/phase4-evidence.md`

**Steps:**
- [ ] **Step 1: Test frontend rendering and API integration**
- [ ] **Step 2: Record evidence in `docs/verification/phase4-evidence.md`**
- [ ] **Step 3: Update `plan.md` and `docs/PLAN-STATE.md` to indicate Phase 4 completion**
