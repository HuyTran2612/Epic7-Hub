# Skill Orchestration

## Mục đích

File này mô tả cách ánh xạ task trong `plan.md` sang skill.

`plan.md` quyết định WHAT.
Skill quyết định HOW.
`AGENTS.md` quyết định luật và state gates.

---

## 1. Task Router

| Loại task | Skill chính | Skill bổ sung |
|---|---|---|
| Khám phá kiến trúc | brainstorming | writing-plans |
| Database | brainstorming | writing-plans, TDD, verification |
| Backend API | brainstorming | writing-plans, TDD, code-review, verification |
| Scraper mới | brainstorming | writing-plans, TDD, code-review, verification |
| Scraper lỗi | systematic-debugging | writing-plans, TDD, code-review, verification |
| Frontend/UI | frontend-design | brainstorming, writing-plans, TDD, code-review, verification |
| Bug bất kỳ | systematic-debugging | writing-plans, TDD, code-review, verification |
| Refactor | writing-plans | TDD, code-review, verification |
| Review PR/code | code-review | requesting-code-review / receiving-code-review |
| Chạy kế hoạch đã có | executing-plans | verification |
| Task độc lập song song | dispatching-parallel-agents | verification |
| Subagent task | subagent-driven-development | verification |
| Git isolation | using-git-worktrees | finishing-development-branch |
| Kết thúc branch | finishing-development-branch | verification |

---

## 2. Giai đoạn Epic7 Personal DB

### Phase 0 — Preparation

Skill:

```text
executing-plans
verification-before-completion
```

Mục tiêu:

- environment
- Node.js
- MySQL
- Git
- package setup
- `.env`
- folder structure

---

### Phase 1 — Database

Pipeline:

```text
brainstorming
→ writing-plans
→ test-driven-development
→ implementation
→ code-review
→ verification-before-completion
```

Evidence:

- schema executes
- expected tables exist
- constraints work
- seed works

---

### Phase 2 — Backend API

Pipeline:

```text
brainstorming
→ writing-plans
→ test-driven-development
→ implementation
→ code-review
→ verification-before-completion
```

Mỗi API nên có test riêng.

Ví dụ:

```text
GET /api/heroes
GET /api/heroes/:key
GET /api/heroes/:key/recommendations
GET /api/artifacts
GET /api/artifacts/:key
```

Evidence:

- API test PASS
- invalid input handled
- database connection verified
- pagination/sorting verified

---

### Phase 3 — Scraper / Sync

Pipeline:

```text
brainstorming
→ writing-plans
→ test-driven-development
→ implementation
→ code-review
→ verification-before-completion
```

Nếu scraper FAIL:

```text
systematic-debugging
→ root cause
→ writing-plans
→ TDD
→ fix
→ code-review
→ verification
```

Evidence:

- fixture parser PASS
- 5–10 hero/artifact test PASS
- upsert PASS
- sync_logs PASS
- retry/error handling PASS

Không chạy full sync trước khi test sample PASS.

---

### Phase 4 — Frontend

Pipeline:

```text
brainstorming
→ frontend-design
→ writing-plans
→ test-driven-development
→ implementation
→ code-review
→ verification-before-completion
```

Mỗi màn hình nên hoàn thành độc lập.

Thứ tự:

```text
Dashboard
→ Heroes List
→ Hero Detail
→ Artifacts
→ Collection
→ Dark mode
→ UX polish
```

Evidence:

- UI loads
- API integration works
- filter/search works
- loading/empty/error states work
- responsive check PASS

---

### Phase 5 — Personal Features

Pipeline tùy tính năng:

```text
brainstorming
→ writing-plans
→ TDD
→ implementation
→ code-review
→ verification
```

Ví dụ:

- Tier List
- Compare
- Skill checklist
- Import/Export
- Statistics

---

### Phase 6 — Completion

Pipeline:

```text
verification-before-completion
→ code-review
→ finishing-development-branch
```

Evidence:

- MVP criteria PASS
- README complete
- `npm run dev` works
- `npm run sync` works
- database backup procedure documented
- no blocking issue

---

## 3. State Machine

```text
TODO
 │
 ▼
PLANNED
 │
 ▼
IN_PROGRESS
 │
 ├──────────────► BLOCKED
 │                    │
 │                    ▼
 │              INVESTIGATING
 │                    │
 │                    ▼
 └──────────────► IN_PROGRESS
                      │
                      ▼
                    TESTING
                      │
             ┌────────┴────────┐
             ▼                 ▼
           FAILED            PASSED
             │                 │
             ▼                 ▼
       DEBUGGING          CODE_REVIEW
                               │
                               ▼
                         VERIFICATION
                               │
                      ┌────────┴────────┐
                      ▼                 ▼
                    FAILED            PASSED
                      │                 │
                      ▼                 ▼
                  DEBUGGING            DONE
```

---

## 4. Quy tắc chuyển state

### TODO → PLANNED

Có task rõ ràng và acceptance criteria.

### PLANNED → IN_PROGRESS

Đã đọc skill cần thiết và bắt đầu thực thi.

### IN_PROGRESS → TESTING

Implementation đã hoàn tất trong phạm vi task.

### TESTING → FAILED

Có test/build/runtime failure.

Chuyển sang `systematic-debugging`.

### TESTING → PASSED

Test liên quan PASS.

### PASSED → CODE_REVIEW

Task đủ điều kiện review.

### CODE_REVIEW → VERIFICATION

Không còn issue blocking/high severity.

### VERIFICATION → DONE

Có evidence thực tế.

---

## 5. Task Contract

Mỗi task nên có:

```md
## Task

### Goal
...

### Scope
...

### Dependencies
...

### Skills
- ...

### Acceptance Criteria
- [ ] ...

### Tests
- [ ] ...

### Verification
- [ ] ...

### Evidence
...

### Status
TODO
```

Agent không nên nhận task chỉ có câu "làm chức năng X" nếu task đó chưa đủ rõ để xác định acceptance criteria.

---

## 6. Khi nào dùng subagent

Chỉ dùng subagent khi task có thể tách thành các phần độc lập.

Ví dụ tốt:

```text
Hero API tests
Artifact API tests
Frontend static layout
```

Ví dụ không nên tách:

```text
Database schema
+
Backend code
```

nếu backend phụ thuộc schema chưa hoàn thành.

---

## 7. Rule cho Epic7 scraper

Scraper là thành phần có rủi ro cao.

Bắt buộc:

- không full sync khi parser chưa được kiểm chứng
- giữ fixture/raw data để regression test
- log lỗi
- retry có giới hạn
- upsert theo key ổn định
- kiểm tra số record trước/sau sync
- verification sau sync

Nếu website đổi HTML:

```text
FAIL
→ systematic-debugging
→ xác định selector/parser thay đổi
→ test fixture mới
→ sửa parser
→ regression test
→ verification
```

---

## 8. Rule cho MVP

Không triển khai Phase 5 khi Phase 0–4 chưa đạt MVP criteria.

Ưu tiên:

```text
Data
→ API
→ Sync
→ UI
→ Personal features
```

Không để tính năng phụ làm chậm MVP.
