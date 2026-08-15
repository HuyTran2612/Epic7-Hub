# AGENT_INSTRUCTIONS.md — Epic7-Hub Reform

> Dành cho AI Agent (Antigravity / Cursor / Claude / …)  
> Mục tiêu: Đọc tài liệu → Sửa code → Không phá hệ thống hiện tại

---

## 1. Bối cảnh dự án

- **Repo:** Epic7-Hub (personal database cho game Epic Seven)
- **Tech:** Node.js + Express 5 + MySQL 8 + Vanilla JS frontend
- **Sync hiện tại:** 1 file duy nhất `backend/scripts/sync.js`
- **Nguồn data:** epic7db.com (scrape) + Smilegate Official JSON + Fribbels + E7Data + E7 Codex

---

## 2. Thứ tự đọc bắt buộc (không bỏ bước)

1. `AGENT_INSTRUCTIONS.md` (file này)
2. `SYSTEM_REFORM_PLAN.md`
3. `docs/02_SYNC_SYSTEM.md`          ← quan trọng nhất
4. `docs/01_DATABASE_OPTIMIZATION.md`
5. `docs/03_CODE_STRUCTURE_AND_LOGIC.md`
6. Đọc lại code thật trước khi sửa:
   - `backend/scripts/sync.js`
   - `backend/scripts/fribbels-e7data-provider.js`
   - `backend/scripts/artifact-class-registry.js`
   - `database/schema.sql`
   - `AGENTS.md` và `plan.md` (nếu có trong repo)

---

## 3. Vấn đề cốt lõi cần sửa

Trong `backend/scripts/sync.js` hiện đang có logic:

```js
if (existingKeys.has(key)) {
  skipped++;
  continue;
}
```

→ Bản ghi đã tồn tại **không bao giờ được UPDATE**.  
Đây là nguyên nhân chính khiến multi-source sync bị stale / dư thừa / không tận dụng hết dữ liệu từ các nguồn.

---

## 4. Việc cần làm (theo thứ tự ưu tiên)

### Phase A — Bắt buộc (làm trước)

**Mục tiêu:** Cho phép UPDATE bản ghi cũ.

1. Bỏ đoạn pure-skip (`if (existingKeys.has(key)) continue`).
2. Luôn chạy merge + `INSERT ... ON DUPLICATE KEY UPDATE`.
3. (Khuyến nghị) Chỉ `skipped++` khi `content_hash` giống hệt bản ghi hiện tại.
4. Log rõ: `new` / `updated` / `skipped` / `failed`.

### Phase B — Bắt buộc

**Mục tiêu:** Field-level merge theo priority nguồn.

**Hero priority:**
| Field | Ưu tiên cao → thấp |
|-------|---------------------|
| name, element, class, rarity | Smilegate Official → epic7db |
| base_stats | epic7db detail / E7Data → Official |
| skills, description | epic7db |
| full_artwork_url | E7 Codex → epic7db |
| is_limited | Hard-coded list ∪ heuristic |

**Artifact priority:**
| Field | Ưu tiên cao → thấp |
|-------|---------------------|
| class_restriction | Fribbels → artifact-class-registry → epic7db |
| name, rarity | Smilegate Official → epic7db |
| full_artwork_url | E7 Codex → epic7db |

Viết hàm `mergeHero(...)` và `mergeArtifact(...)` rõ ràng, không merge lung tung trong vòng lặp.

### Phase C — Nên làm

- Đảm bảo **mọi** key đều đi qua `slugify()`.
- Mở rộng `ALIASES` trong `slugify` nếu phát hiện case mới.
- Thêm hàm `detectLimited(key)` kết hợp hard-coded list + heuristic (ae-, summer-, holiday-…).

### Phase D — Tùy chọn

- Thêm cột `content_hash` vào `heroes` / `artifacts` (xem `01_DATABASE_OPTIMIZATION.md`).
- Thêm bảng `sync_conflicts` để ghi nhận khi 2 nguồn khác nhau.

---

## 5. Ràng buộc tuyệt đối (KHÔNG được phá)

- Giữ **1 file** `sync.js` (không tách lại thành nhiều file sync).
- Không đổi contract API frontend.
- Không đổi tên cột / xóa cột đang dùng của `user_notes`, `collection` (nếu còn).
- Vẫn dùng `key_name` UNIQUE làm identity chính (không chuyển sang UUID).
- Tuân thủ `AGENTS.md` của dự án: plan → implement → test → verify.
- Trước khi sửa bất kỳ file nào: **đọc lại file đó**.

---

## 6. Kiểm thử sau khi sửa

```bash
npm test
npm run sync
```

**Tiêu chí PASS:**
- [ ] Không tạo bản ghi trùng `key_name`
- [ ] Bản ghi đã có được **UPDATE** khi nguồn có data mới
- [ ] `npm test` không fail
- [ ] `npm run sync` chạy xong không crash
- [ ] class_restriction của artifact lấy đúng từ Fribbels khi có dữ liệu
- [ ] is_limited vẫn đúng với các hero/artifact limited đã biết

---

## 7. Cách báo cáo khi xong

1. Liệt kê các file đã sửa.
2. Tóm tắt thay đổi chính (đặc biệt đoạn bỏ pure-skip và hàm merge).
3. Kết quả `npm test` và `npm run sync`.
4. (Nếu có) Cập nhật `plan.md` hoặc ghi evidence.

---

## 8. Bắt đầu ngay

1. Đọc xong toàn bộ mục 2.
2. Mở `backend/scripts/sync.js`.
3. Thực hiện Phase A trước, chạy test nhanh.
4. Tiếp tục Phase B.
5. Chỉ dừng khi đạt tiêu chí ở mục 6.
