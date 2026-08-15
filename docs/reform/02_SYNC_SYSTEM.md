# Cải tiến Hệ thống Sync Multi-Source – Epic7-Hub

> Đã đọc: `backend/scripts/sync.js` (toàn bộ), `fribbels-e7data-provider.js`, `artifact-class-registry.js`, `docs/plans/2026-08-15-multi-source-sync-plan.md`, `docs/plans/2026-08-12-dual-source-sync-plan.md`

## 1. Pipeline hiện tại (As-Is)

File duy nhất: `backend/scripts/sync.js`

```
Stage 1: syncHeroesStage()
  - Lấy key list từ epic7db.com/heroes
  - Lấy key list từ Smilegate Official JSON
  - Union keys
  - Với mỗi key: nếu đã có trong DB → SKIP
  - Ngược lại: scrape epic7db detail → fallback Official → enrich E7Data + Fribbels + E7 Codex → INSERT

Stage 2: syncArtifactsStage()  (logic tương tự)

Stage 3: PvE Tier List sync
```

**Vấn đề lớn nhất:** dòng kiểu

```js
if (existingKeys.has(key)) {
  skipped++;
  continue;
}
```

→ Bản ghi đã tồn tại **không bao giờ được cập nhật**. Đây là nguyên nhân chính khiến data stale và multi-source không phát huy hết tác dụng.

## 2. Pipeline đề xuất (To-Be) – vẫn giữ 1 file

```
1. Discover keys từ tất cả nguồn → Set unique key_name (đã slugify chặt)
2. Với mỗi key:
   a. Lấy data từ từng nguồn (nếu có)
   b. Merge field-level theo priority
   c. Tính content_hash của object đã merge
   d. Nếu DB đã có + hash giống → skip
   e. Ngược lại → UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
   f. Ghi conflict nếu có field mâu thuẫn quan trọng
3. Ghi sync_logs
```

## 3. Source Priority (chuẩn hóa)

### Heroes

| Field              | Ưu tiên cao → thấp                          |
|--------------------|---------------------------------------------|
| name               | Smilegate Official → epic7db                |
| element, class, rarity | Smilegate Official → epic7db             |
| base_stats         | epic7db detail / E7Data → Official          |
| skills, description, recommended_builds | epic7db                  |
| image_url          | epic7db                                     |
| full_artwork_url   | E7 Codex → epic7db                          |
| is_limited         | Hard-coded list ∪ heuristic ∪ Official flag |

### Artifacts

| Field              | Ưu tiên cao → thấp                          |
|--------------------|---------------------------------------------|
| name, rarity       | Smilegate Official → epic7db                |
| class_restriction  | Fribbels → artifact-class-registry → epic7db |
| base_stats / max_stats | Fribbels / epic7db                       |
| skill_description  | epic7db                                     |
| full_artwork_url   | E7 Codex → epic7db                          |
| is_limited         | Hard-coded list ∪ heuristic                 |

## 4. Thay đổi cụ thể trong `sync.js`

### 4.1. Bỏ pure-skip, chuyển sang upsert thông minh

```js
// TRƯỚC (xấu)
if (existingKeys.has(key)) {
  skipped++;
  continue;
}

// SAU (tốt)
const existing = existingMap.get(key); // map key_name → {content_hash, ...}
const merged = mergeHeroFromSources(key, sourceAData, sourceBData, ...);
const hash = sha256(JSON.stringify(merged));

if (existing && existing.content_hash === hash) {
  skipped++;
  continue;
}

// UPSERT
await pool.query(upsertSql, [...]);
```

### 4.2. Hàm merge field-level

```js
function mergeHero(primary, secondary, fribbels, e7stats, codexArt) {
  return {
    key_name: primary?.key_name || secondary?.key_name,
    name: secondary?.name || primary?.name,               // Official ưu tiên
    element: secondary?.element || primary?.element,
    class: secondary?.class || primary?.class,
    rarity: secondary?.rarity || primary?.rarity,
    base_stats: (primary?.base_stats?.atk > 0 ? primary.base_stats : e7stats),
    skills: primary?.skills?.length ? primary.skills : [],
    description: primary?.description || secondary?.description,
    image_url: primary?.image_url || secondary?.image_url,
    full_artwork_url: codexArt || primary?.image_url,
    is_limited: detectLimited(primary?.key_name || secondary?.key_name)
  };
}
```

### 4.3. Cải thiện `slugify`

Giữ nguyên hàm hiện tại + mở rộng ALIASES map khi phát hiện case mới.  
Bắt buộc gọi `slugify` ở **mọi** nơi tạo key (epic7db href, Official name, Fribbels name).

### 4.4. Detect Limited thông minh hơn

```js
function detectLimited(key) {
  if (LIMITED_HERO_KEYS.has(key)) return true;
  if (key.startsWith('ae-')) return true;           // aespa collab
  if (/^(summer|holiday|seaside|festive|midsummer|ocean|afternoon)/.test(key)) return true;
  return false;
}
```

Giữ hard-coded list làm nguồn sự thật chính, heuristic chỉ bổ sung.

## 5. Rate limit & An toàn

- Giữ `SLEEP_MS = 300` (hoặc tăng nhẹ nếu bị chặn).
- User-Agent thật.
- Timeout rõ ràng.
- Không chạy full sync quá thường xuyên (chỉ khi cần).

## 6. Logging

- Tiếp tục ghi `sync_logs`.
- Khi có conflict field quan trọng → insert `sync_conflicts`.
- Console log rõ: `new / updated / skipped / failed / conflicts`.

## 7. Test cần cập nhật

- `backend/tests/sync.test.js`
- `backend/tests/multi-source.test.js`

Đảm bảo:

1. Key đã tồn tại + data đổi → được UPDATE.
2. Key đã tồn tại + data giống → SKIP.
3. Không tạo duplicate `key_name`.
4. class_restriction lấy đúng từ Fribbels khi có.

## 8. Lệnh chạy

```bash
npm run sync          # full
```
