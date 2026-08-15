# Kế hoạch Cải cách Hệ thống Epic7-Hub

> **Phiên bản:** 2.0 (bám sát codebase thực tế)  
> **Ngày:** 2026-08-15  
> **Repo:** https://github.com/HuyTran2612/Epic7-Hub  
> **Đã đọc trước khi viết:** `plan.md`, `AGENTS.md`, `database/schema.sql`, `backend/scripts/sync.js`, `fribbels-e7data-provider.js`, `artifact-class-registry.js`, các plan trong `docs/plans/`

---

## 1. Hiện trạng (As-Is)

### 1.1. Kiến trúc hiện tại

```
Frontend (Vanilla JS SPA)
        │
        ▼
Backend Express (routes + controllers)
        │
        ▼
MySQL 8 (heroes, artifacts, user_notes, sync_logs...)
        ▲
        │
backend/scripts/sync.js   ◄── 1-file unified pipeline
   ├── Stage 1: Heroes (epic7db scrape + Smilegate Official JSON + Fribbels + E7Data + E7 Codex)
   ├── Stage 2: Artifacts (tương tự)
   └── Stage 3: PvE Tier List (epic7db)
```

### 1.2. Điểm mạnh đã có

- Đã hợp nhất sync thành **1 file** `sync.js` (đúng hướng Single Responsibility cho pipeline).
- Dùng `key_name` UNIQUE + `ON DUPLICATE KEY UPDATE` → chống trùng cơ bản tốt.
- Có `slugify()` + alias map cho một số tên đặc biệt.
- Có LIMITED_HERO_KEYS / LIMITED_ARTIFACT_KEYS hard-coded.
- Có E7 Codex để lấy full_artwork_url chất lượng cao.
- Có Fribbels làm nguồn class_restriction cho artifact khá tin cậy.
- Có `sync_logs` để ghi lịch sử.

### 1.3. Vấn đề còn tồn tại (cần cải cách)

| # | Vấn đề | Mô tả chi tiết trong code hiện tại | Hậu quả |
|---|--------|------------------------------------|--------|
| 1 | Skip quá thô | `if (existingKeys.has(key)) { skipped++; continue; }` | Không bao giờ **update** bản ghi đã có → data cũ bị stale khi nguồn thay đổi |
| 2 | Thiếu field-level merge | Khi có data từ nhiều nguồn, ghi đè toàn bộ hoặc lấy nguồn đầu tiên | Mất thông tin tốt từ nguồn phụ |
| 3 | Không có content hash / raw layer | Mỗi lần sync đều parse lại HTML dù data không đổi | Lãng phí request, dễ bị rate-limit |
| 4 | Identity chỉ dựa vào key_name | Khi 2 nguồn tạo slug khác nhau (do tên hơi khác) → có thể tạo bản ghi trùng | Duplicate đã từng xảy ra (plan.md ghi nhận đã xóa 9 hero + 11 artifact dupes) |
| 5 | Hard-coded LIMITED list | Phải maintain tay danh sách 48 heroes + 30 artifacts | Dễ thiếu khi game ra limited mới |
| 6 | Không có conflict log | Khi 2 nguồn khác nhau về rarity / element / class → không biết | Khó debug |
| 7 | Stage 3 (PvE Tier) gắn cứng | Logic tier nằm trong cùng file sync | Khó mở rộng tier list khác (PvP, GW…) |

---

## 2. Mục tiêu cải cách (To-Be)

1. **Update được bản ghi cũ** khi nguồn có data mới hơn (không chỉ insert new).
2. **Field-level priority**: mỗi field chọn nguồn ưu tiên rõ ràng.
3. **Idempotent thật sự**: content hash → skip nếu payload không đổi.
4. **Chống trùng mạnh hơn**: giữ `key_name` UNIQUE + bổ sung mapping external_id nếu cần + canonical slug chặt chẽ hơn.
5. **Tự động phát hiện Limited** thay vì hard-code list dài.
6. **Giữ 1-file pipeline** nhưng tách rõ các hàm stage + provider (không tách thành nhiều file sync lại).
7. **Tương thích ngược** với schema hiện tại và frontend hiện tại (không phá API / UI).

---

## 3. Nguyên tắc thiết kế mới (áp dụng cho Epic7-Hub)

1. **key_name là Canonical ID** (giữ nguyên thiết kế hiện tại – không chuyển sang UUID).
2. **Raw-first optional**: có thể thêm bảng `raw_ingestions` sau, nhưng giai đoạn 1 chưa bắt buộc.
3. **Always upsert, never pure-skip** khi chạy full sync (trừ khi content hash giống hệt).
4. **Source Priority rõ ràng**:
   - Tên / Element / Class / Rarity: Smilegate Official > epic7db > Fribbels
   - Base Stats: E7Data / epic7db detail > Official
   - Skills / Description / Recommended: epic7db
   - Class Restriction (Artifact): Fribbels > artifact-class-registry > epic7db
   - Artwork: E7 Codex > epic7db
5. **Limited detection**: kết hợp hard-coded list + heuristic (tên bắt đầu bằng season/collab pattern) + flag từ nguồn nếu có.
6. **Tuân thủ AGENTS.md**: mọi thay đổi phải có plan → implement → test → verify.

---

## 4. Roadmap cải cách đề xuất

| Phase | Nội dung | File chính bị ảnh hưởng | Ưu tiên |
|-------|----------|--------------------------|--------|
| A | Sửa logic skip → luôn upsert + chỉ skip khi hash giống | `sync.js` | Cao |
| B | Field-level merge theo priority nguồn | `sync.js` | Cao |
| C | Cải thiện `slugify` + alias map + normalize mạnh hơn | `sync.js` | Cao |
| D | Tự động detect Limited (giảm phụ thuộc list hard-code) | `sync.js` | Trung bình |
| E | Thêm bảng `sync_conflicts` + log khi field conflict | `schema.sql` + `sync.js` | Trung bình |
| F | (Tùy chọn) Thêm `content_hash` vào heroes/artifacts hoặc bảng raw | `schema.sql` | Thấp |
| G | Tách Stage 3 Tier List thành hàm riêng + hỗ trợ nhiều category | `sync.js` | Thấp |
| H | Cập nhật test (`multi-source.test.js`, `sync.test.js`) | `backend/tests/` | Cao |

---

## 5. Phạm vi không làm trong đợt này

- Không chuyển sang PostgreSQL / Prisma.
- Không tách `sync.js` thành nhiều file sync lại (đã từng hợp nhất 1-file, giữ nguyên).
- Không thay đổi API public của frontend.
- Không thêm authentication / multi-user (vẫn là personal DB).

---

## 6. Tiêu chí hoàn thành

- [ ] Chạy `npm run sync` vẫn thành công, không tạo bản ghi trùng `key_name`.
- [ ] Bản ghi đã tồn tại được **cập nhật** khi nguồn có data mới.
- [ ] Field quan trọng (element, class, rarity, class_restriction, is_limited, full_artwork_url) lấy đúng theo priority nguồn.
- [ ] `npm test` vẫn PASS (hoặc được cập nhật tương ứng).
- [ ] Không phá vỡ frontend hiện tại.
- [ ] Có ghi nhận vào `plan.md` và evidence trong `docs/verification/`.

---

## 7. Liên kết tài liệu chi tiết

- [01_DATABASE_OPTIMIZATION.md](./docs/01_DATABASE_OPTIMIZATION.md)
- [02_SYNC_SYSTEM.md](./docs/02_SYNC_SYSTEM.md)
- [03_CODE_STRUCTURE_AND_LOGIC.md](./docs/03_CODE_STRUCTURE_AND_LOGIC.md)
