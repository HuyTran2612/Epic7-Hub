# AGENTS.md — Epic7 Personal DB

## 1. Mục đích

Đây là quy tắc vận hành cho AI Agent khi phát triển dự án Epic7 Personal DB.

Nguồn sự thật của dự án:

1. `plan.md` — WHAT cần làm và trạng thái hiện tại.
2. `.agents/skills/<skill-name>/SKILL.md` — HOW thực hiện từng kỹ năng.
3. `AGENTS.md` — luật điều phối và các cổng kiểm soát.
4. `docs/plans/` — kế hoạch chi tiết của từng task.
5. `docs/verification/` — bằng chứng kiểm thử/xác minh.

Không tự ý thay thế hoặc mâu thuẫn với `plan.md` nếu chưa có quyết định rõ ràng.

---

## 2. Luật bắt buộc

### 2.1 Không sửa code mò

Khi có bug, crash hoặc test FAIL:

1. Kích hoạt `systematic-debugging`.
2. Điều tra nguyên nhân gốc.
3. Chỉ sau khi có root cause mới lập kế hoạch sửa.
4. Không sửa theo triệu chứng nếu chưa xác định nguyên nhân.

### 2.2 Không nhảy phase

Không bỏ qua các phase bắt buộc của task.

Tối thiểu:

`plan → implement → test → verify`

Với task phức tạp, dùng pipeline tương ứng ở mục 5.

### 2.3 Khai báo skill

Khi bắt đầu một skill, phải ghi:

`[Activating skill: .agents/skills/<skill-name>]`

Sau đó đọc:

`.agents/skills/<skill-name>/SKILL.md`

Không tự suy diễn nội dung của SKILL.md nếu file chưa được đọc.

### 2.4 State gate

Chỉ chuyển sang bước tiếp theo khi có evidence.

Evidence hợp lệ có thể là:

- test output PASS
- build thành công
- API test thành công
- schema migration thành công
- screenshot/UI verification
- code review không còn issue nghiêm trọng
- log sync thành công

Không đánh dấu `[x]` chỉ vì code "có vẻ đúng".

---

## 3. Cách Agent bắt đầu mỗi lượt làm việc

### Bước 1 — Đọc trạng thái

Đọc `plan.md`.

Xác định:

- current phase
- current task
- task dependencies
- acceptance criteria
- task đã hoàn thành hay chưa

### Bước 2 — Chọn pipeline

Phân loại task:

- Bug → Bug Fixing Pipeline
- Feature → New Feature Pipeline
- Frontend/UI → Frontend Pipeline
- Refactor → Review/Verification Pipeline
- Git branch → Git Pipeline

### Bước 3 — Đọc skill

Chỉ đọc các `SKILL.md` cần thiết cho pipeline.

### Bước 4 — Thực thi task nhỏ

Không làm vượt phạm vi task hiện tại nếu chưa cập nhật plan.

### Bước 5 — Verify

Chạy kiểm tra thực tế.

### Bước 6 — Cập nhật trạng thái

Chỉ sau khi verification PASS mới cập nhật `plan.md`.

---

## 4. Các skill khả dụng

- `brainstorming`
- `code-review`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `frontend-design`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `writing-plans`
- `writing-skills`

Nếu skill directory thực tế có khác biệt, ưu tiên danh sách và file tồn tại trong repository.

---

## 5. Pipeline

### 5.1 Bug Fixing

```text
systematic-debugging
        ↓
writing-plans
        ↓
test-driven-development
        ↓
implementation
        ↓
code-review
        ↓
verification-before-completion
        ↓
finishing-a-development-branch
```

Không được bỏ `systematic-debugging`.

### 5.2 New Feature

```text
brainstorming
        ↓
writing-plans
        ↓
test-driven-development
        ↓
implementation
        ↓
code-review
        ↓
verification-before-completion
        ↓
finishing-a-development-branch
```

### 5.3 Frontend / UI

```text
brainstorming
        ↓
frontend-design
        ↓
writing-plans
        ↓
test-driven-development
        ↓
implementation
        ↓
code-review
        ↓
verification-before-completion
        ↓
finishing-a-development-branch
```

### 5.4 Refactor

```text
writing-plans
        ↓
test-driven-development
        ↓
implementation
        ↓
code-review
        ↓
verification-before-completion
```

Nếu refactor xuất phát từ bug, bắt buộc chuyển sang Bug Fixing Pipeline.

### 5.5 Parallel Work

Chỉ dùng:

`dispatching-parallel-agents`

hoặc:

`subagent-driven-development`

khi các task thực sự độc lập.

Không chạy song song nếu hai task cùng sửa một file hoặc có dependency chưa hoàn thành.

### 5.6 Git Isolation

Dùng:

`using-git-worktrees`

khi cần cô lập feature/bug branch hoặc có nhiều luồng phát triển.

---

## 6. Quy tắc cập nhật plan.md

`plan.md` là source of truth về tiến độ.

Không chỉ đổi:

```md
- [ ] Task
```

thành:

```md
- [x] Task
```

mà phải ghi evidence khi task quan trọng hoàn thành.

Ví dụ:

```md
- [x] Viết database/schema.sql

  Evidence:
  - MySQL schema execution: PASS
  - Tables created: PASS
  - Foreign keys: PASS
  - Verification: PASS
```

Nếu FAIL:

```md
- [ ] Viết database/schema.sql

  Status: BLOCKED
  Reason: ...
  Next skill: systematic-debugging
```

---

## 7. Không tự mở rộng scope

Dự án là personal project.

Nếu phát hiện ý tưởng mới:

- không tự triển khai ngay
- ghi vào `docs/backlog.md` hoặc đề xuất với người dùng
- chỉ đưa vào `plan.md` sau khi được chấp nhận

Ưu tiên MVP trước tính năng nâng cao.

---

## 8. Definition of Done

Một task chỉ DONE khi:

- implementation hoàn tất
- test liên quan PASS
- không còn lỗi nghiêm trọng từ review
- verification thực tế PASS
- evidence được ghi lại
- `plan.md` được cập nhật

Một phase chỉ DONE khi toàn bộ task bắt buộc của phase đã DONE.

MVP chỉ DONE khi thỏa các tiêu chí MVP trong `plan.md`.

---

## 9. Không đoán

Nếu thiếu:

- file
- log
- test output
- cấu trúc code
- schema
- dữ liệu thực tế

thì phải kiểm tra hoặc yêu cầu dữ liệu cần thiết.

Không tuyên bố "đã chạy", "đã PASS", "đã verify" nếu chưa thực sự có evidence.

---

## 10. Nguyên tắc ưu tiên

```text
Correctness
    >
Verification
    >
Maintainability
    >
Performance
    >
Convenience
```

Với scraper:

```text
Data correctness
    >
Source resilience
    >
Logging/debuggability
    >
Performance
```
