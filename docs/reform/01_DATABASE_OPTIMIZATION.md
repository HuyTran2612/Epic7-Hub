# Tối ưu Database Epic7-Hub (MySQL)

> Đã đọc: `database/schema.sql`, `plan.md`, `backend/scripts/sync.js`

## 1. Schema hiện tại (giữ nguyên core)

Các bảng đang dùng:

- `heroes` — canonical hero, UNIQUE `key_name`
- `artifacts` — canonical artifact, UNIQUE `key_name`
- `hero_artifact_recommendations`
- `user_notes` (có `personal_tier`, `category`)
- `sync_logs`

**Quyết định:** Không chuyển sang UUID. Tiếp tục dùng `key_name` làm business key chính (phù hợp với Epic Seven community data).

## 2. Vấn đề cần xử lý ở tầng DB

1. Không có cơ chế ghi nhận **conflict** khi multi-source khác nhau.
2. Không có `content_hash` → khó skip khi data không đổi.
3. `ON DUPLICATE KEY UPDATE` hiện tại cập nhật hầu hết field, nhưng logic phía application lại **skip** nếu `key_name` đã tồn tại → update gần như không bao giờ chạy.
4. Thiếu index hỗ trợ một số filter phổ biến (nếu sau này thêm search nâng cao).

## 3. Đề xuất thay đổi Schema (tối thiểu, tương thích ngược)

### 3.1. Thêm cột hỗ trợ sync (optional nhưng khuyến nghị)

```sql
-- Heroes
ALTER TABLE heroes
  ADD COLUMN content_hash VARCHAR(64) NULL AFTER last_synced_at,
  ADD COLUMN source_flags JSON NULL COMMENT 'bit flags / list of sources that contributed';

-- Artifacts
ALTER TABLE artifacts
  ADD COLUMN content_hash VARCHAR(64) NULL AFTER last_synced_at,
  ADD COLUMN source_flags JSON NULL;
```

### 3.2. Bảng conflict log (mới)

```sql
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('hero','artifact') NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  field_name VARCHAR(80) NOT NULL,
  source_a VARCHAR(50) NOT NULL,
  value_a JSON,
  source_b VARCHAR(50) NOT NULL,
  value_b JSON,
  resolution VARCHAR(30) NULL,          -- kept_a | kept_b | merged | ignored
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conflict_entity (entity_type, key_name),
  INDEX idx_conflict_unresolved (resolution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3. Index hiện có đã tốt

Giữ nguyên:

- `idx_heroes_element_class`
- `idx_heroes_rarity`
- `idx_heroes_limited`
- `idx_heroes_key`
- tương tự artifacts

Không cần thêm nhiều index lúc này.

## 4. Quy tắc chống trùng ở tầng DB

1. **UNIQUE (`key_name`)** vẫn là hàng rào cuối cùng.
2. Application layer phải **chuẩn hóa `key_name` thật chặt** trước khi upsert (xem `slugify` trong `sync.js`).
3. Khi phát hiện 2 nguồn tạo ra 2 `key_name` khác nhau cho cùng 1 hero thật → ghi vào `sync_conflicts` + ưu tiên alias map.
4. Không bao giờ xóa bản ghi canonical chỉ vì một nguồn biến mất (chỉ update `last_synced_at` / soft flag nếu cần).

## 5. Migration an toàn

```sql
-- Chạy khi sẵn sàng
USE epic7_personal;

ALTER TABLE heroes
  ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NULL AFTER last_synced_at,
  ADD COLUMN IF NOT EXISTS source_flags JSON NULL;

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NULL AFTER last_synced_at,
  ADD COLUMN IF NOT EXISTS source_flags JSON NULL;

-- Tạo bảng conflict
-- (copy câu CREATE TABLE ở trên)
```

Sau migration vẫn tương thích 100% với code cũ (cột mới cho phép NULL).

## 6. Checklist

- [ ] Giữ UNIQUE `key_name`
- [ ] Thêm `content_hash` (optional phase)
- [ ] Thêm `sync_conflicts`
- [ ] Không phá vỡ `user_notes` / frontend
- [ ] Cập nhật `database/schema.sql` + seed nếu cần
- [ ] Chạy `node database/verify.js` sau migration
