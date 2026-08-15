# Tối ưu cấu trúc File & Logic – Epic7-Hub

> Đã đọc toàn bộ cấu trúc: `backend/scripts/`, `backend/src/`, `frontend/js/`, `database/`, `docs/plans/`, `AGENTS.md`

## 1. Cấu trúc hiện tại (giữ nguyên hướng)

```
Epic7-Hub/
├── backend/
│   ├── scripts/
│   │   ├── sync.js                      ← 1-file pipeline (giữ)
│   │   ├── fribbels-e7data-provider.js  ← provider
│   │   └── artifact-class-registry.js   ← registry
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/   (heroes.js, artifacts.js, hero-detail.js, ...)
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── verify.js
├── docs/
├── plan.md
├── AGENTS.md
└── package.json
```

**Quyết định quan trọng:**  
Không tách lại `sync.js` thành nhiều file sync (đã từng hợp nhất 1-file ở Phase 6). Chỉ refactor **bên trong** file cho rõ ràng.

## 2. Anti-pattern hiện có cần loại bỏ / sửa

| Anti-pattern | Vị trí | Cách sửa |
|--------------|--------|----------|
| Pure skip khi `existingKeys.has(key)` | `sync.js` Stage 1 & 2 | Đổi thành upsert + content_hash check |
| Merge nguồn quá đơn giản (fallback tuần tự) | `sync.js` | Viết hàm `mergeHero` / `mergeArtifact` field-level |
| Hard-coded LIMITED list dài + thiếu heuristic | `sync.js` | Giữ list + thêm `detectLimited()` |
| `slugify` chưa được dùng thống nhất mọi nguồn | một số chỗ Official / Fribbels | Bắt buộc mọi key đều qua `slugify()` |
| Logic Stage 3 (tier) lẫn với sync data | `sync.js` | Tách thành hàm `syncPveTierStage()` rõ ràng |
| Thiếu conflict logging | toàn bộ | Thêm ghi `sync_conflicts` khi cần |

## 3. Cấu trúc logic đề xuất bên trong `sync.js`

```js
// === Constants & Config ===
// LIMITED_HERO_KEYS, LIMITED_ARTIFACT_KEYS, SLEEP_MS, URLs...

// === Utilities ===
function slugify(name) { ... }
function detectLimited(key, type) { ... }
function sha256(obj) { ... }
function delay(ms) { ... }

// === Parsers ===
function parseHeroPage(html, urlKey) { ... }
function parseArtifactPage(html, urlKey) { ... }

// === Providers (gọi external) ===
async function getE7CodexArtwork(...) { ... }
// Fribbels & E7Data đã tách file riêng → import

// === Mergers ===
function mergeHero(sources) { ... }      // field-level priority
function mergeArtifact(sources) { ... }

// === Stages ===
async function syncHeroesStage(limit) { ... }
async function syncArtifactsStage(limit) { ... }
async function syncPveTierStage() { ... }

// === Main ===
async function main() {
  // Stage 1 → 2 → 3
  // Ghi sync_logs
}
```

## 4. Quy tắc logic bắt buộc

1. **Mọi key_name** phải đi qua `slugify()` trước khi dùng.
2. **Không bao giờ** `continue` chỉ vì key đã tồn tại (trừ khi hash giống).
3. **Upsert** luôn dùng `INSERT ... ON DUPLICATE KEY UPDATE`.
4. **Provider** (Fribbels, E7 Codex, Official) chỉ trả raw data, không tự ghi DB.
5. **Merger** là nơi duy nhất quyết định giá trị cuối cùng của từng field.
6. Khi thêm nguồn mới → chỉ cần:
   - Thêm hàm fetch
   - Thêm vào `mergeHero` / `mergeArtifact` với priority
   - Không đụng vào phần upsert

## 5. Frontend & API

- Không cần thay đổi lớn.
- Các file `heroes.js`, `artifacts.js`, `hero-detail.js`, `artifact-detail.js` đã tách tốt.
- API controllers giữ nguyên contract.

## 6. Checklist tối ưu logic

- [ ] Bỏ pure-skip trong `syncHeroesStage` và `syncArtifactsStage`
- [ ] Thêm `mergeHero` / `mergeArtifact`
- [ ] Thêm `detectLimited` heuristic
- [ ] Đảm bảo mọi nguồn đều `slugify`
- [ ] (Optional) Thêm `content_hash` vào upsert
- [ ] Cập nhật test tương ứng
- [ ] Chạy `npm test` và `npm run sync` verify
- [ ] Ghi evidence vào `docs/verification/`
- [ ] Cập nhật `plan.md`

## 7. Tuân thủ quy trình dự án

Trước mọi thay đổi code:

1. Đọc lại `plan.md` + `AGENTS.md`
2. Đọc lại file sắp sửa
3. Viết / cập nhật plan nhỏ trong `docs/plans/` nếu task lớn
4. Implement → Test → Verify
5. Không đánh dấu `[x]` khi chưa có evidence
