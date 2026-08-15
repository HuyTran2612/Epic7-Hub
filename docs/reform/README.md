# Epic7-Hub — Tài liệu Cải cách & Tối ưu Hệ thống

Bộ tài liệu này được viết **sau khi đọc toàn bộ source code** của dự án [Epic7-Hub](https://github.com/HuyTran2612/Epic7-Hub).

**Mục tiêu:**
- Cập nhật thông tin **Hero** & **Artifact** khi sync từ nhiều nguồn mà **không trùng lặp / dư thừa**
- Cải cách hệ thống sync hiện tại (`backend/scripts/sync.js`)
- Tối ưu Database (MySQL schema hiện tại)
- Tối ưu logic các file (đặc biệt pipeline sync 1-file)

---

## Cấu trúc tài liệu

| File | Nội dung |
|------|----------|
| [SYSTEM_REFORM_PLAN.md](./SYSTEM_REFORM_PLAN.md) | Kế hoạch cải cách tổng thể, bám sát codebase hiện tại |
| [docs/01_DATABASE_OPTIMIZATION.md](./docs/01_DATABASE_OPTIMIZATION.md) | Tối ưu schema MySQL hiện có + chống trùng |
| [docs/02_SYNC_SYSTEM.md](./docs/02_SYNC_SYSTEM.md) | Cải tiến pipeline multi-source trong `sync.js` |
| [docs/03_CODE_STRUCTURE_AND_LOGIC.md](./docs/03_CODE_STRUCTURE_AND_LOGIC.md) | Tối ưu logic file, anti-pattern cần loại bỏ |

---

## Tóm tắt hiện trạng dự án (đã đọc)

| Thành phần | Hiện trạng |
|------------|------------|
| Tech Stack | Node.js + Express 5 + MySQL 8 + Vanilla JS frontend |
| Sync | 1 file duy nhất `backend/scripts/sync.js` (Stage 1 Heroes → Stage 2 Artifacts → Stage 3 PvE Tier) |
| Nguồn data | epic7db.com (scrape), Smilegate Official JSON, Fribbels, E7Data stats, E7 Codex artwork |
| Identity | `key_name` UNIQUE + `ON DUPLICATE KEY UPDATE` |
| Schema | `heroes`, `artifacts`, `hero_artifact_recommendations`, `user_notes`, `sync_logs` |
| Vấn đề chính | Multi-source merge còn đơn giản, thiếu field-level priority, skip logic quá thô (chỉ skip nếu `key_name` đã tồn tại), chưa có raw layer / content hash, chưa có conflict log |

---

## Quy tắc bắt buộc trước khi update

> **Trước khi thực hiện bất kỳ thay đổi code nào, phải đọc lại toàn bộ dự án (đặc biệt `plan.md`, `AGENTS.md`, `backend/scripts/sync.js`, `database/schema.sql`) rồi mới tiến hành update.**

Tuân thủ `AGENTS.md` và các skill trong `.agents/skills/`.
