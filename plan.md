# Kế hoạch xây dựng Website Cá nhân Tổng hợp Hero & Artifact - Epic Seven

**Tên dự án:** Epic7 Personal DB  
**Mục tiêu:** Website cá nhân (không công khai) tổng hợp thông tin Hero và Artifact của game Epic Seven, lấy dữ liệu từ epic7db.com (và nguồn community nếu cần).  
**Tech Stack:**
- Frontend: HTML + CSS + JavaScript (Vanilla / Alpine.js / HTMX)
- Backend: Node.js (Express hoặc Fastify)
- Database: MySQL
- Scraper / Sync: Node.js scripts (cheerio / axios / playwright)

**Phạm vi:** Chỉ dùng cá nhân → ưu tiên đơn giản, dễ maintain, dễ cập nhật khi game có patch.

---

## 1. Tổng quan kiến trúc

```
┌─────────────────┐     HTTP/JSON      ┌──────────────────┐
│   Frontend      │ ◄────────────────► │   Backend        │
│ (HTML/CSS/JS)   │                    │ (Node.js + API)  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │     MySQL        │
                                       │ (Heroes, Artifacts,│
                                       │  Notes, Wishlist)│
                                       └──────────────────┘
                                                ▲
                                                │ Sync Script
                                       ┌──────────────────┐
                                       │  Scraper / Sync  │
                                       │ (epic7db + JSON) │
                                       └──────────────────┘
```

---

## 2. Các giai đoạn thực hiện

### Giai đoạn 0: Chuẩn bị (1-2 ngày)

**Mục tiêu:** Setup môi trường và chuẩn bị công cụ.

- [x] Cài đặt Node.js (LTS), MySQL, Git
- [x] Tạo thư mục dự án và khởi tạo Git
- [x] Tạo database MySQL: `epic7_personal`
- [x] Cài các package cơ bản (`express`, `mysql2`, `dotenv`, `cors`, `nodemon`, `axios`, `cheerio`)
- [x] Tạo file `.env` (không commit)
- [x] Tạo cấu trúc thư mục cơ bản (xem mục 3)

  Evidence:
  - Node.js v24.16.0: PASS
  - MySQL 8.0.46 DB `epic7_personal` creation & connection: PASS
  - Git initialized & `.gitignore` created: PASS
  - Packages installed & audited: PASS
  - Folder structure created: PASS
  - Detail evidence log: `docs/verification/phase0-evidence.md`

---

### Giai đoạn 1: Thiết kế Database (1 ngày)

**Mục tiêu:** Xây dựng schema vững chắc, dễ mở rộng.

#### 1.1. Schema chính

```sql
-- heroes
CREATE TABLE heroes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,          -- ví dụ: arbiter-vildred
  name VARCHAR(150) NOT NULL,
  element ENUM('Fire','Ice','Earth','Light','Dark') NOT NULL,
  class ENUM('Warrior','Knight','Thief','Ranger','Mage','Soul Weaver') NOT NULL,
  rarity TINYINT NOT NULL,                        -- 3,4,5
  is_limited BOOLEAN DEFAULT FALSE,
  base_stats JSON,                                -- {hp, atk, def, spd, ...}
  skills JSON,                                    -- mảng skill
  exclusive_equipment JSON,
  recommended_builds JSON,
  image_url VARCHAR(500),
  description TEXT,
  last_synced_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- artifacts
CREATE TABLE artifacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  rarity TINYINT NOT NULL,
  class_restriction VARCHAR(50),                  -- 'General' hoặc class cụ thể
  base_stats JSON,
  max_stats JSON,
  skill_description TEXT,
  skill_max_description TEXT,
  recommended_heroes JSON,
  image_url VARCHAR(500),
  last_synced_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Quan hệ nhiều-nhiều (nếu cần chi tiết hơn)
CREATE TABLE hero_artifact_recommendations (
  hero_id INT,
  artifact_id INT,
  priority TINYINT DEFAULT 1,                     -- 1 = recommended cao
  note VARCHAR(255),
  PRIMARY KEY (hero_id, artifact_id),
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- Ghi chú cá nhân
CREATE TABLE user_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('hero','artifact') NOT NULL,
  target_id INT NOT NULL,
  note TEXT,
  personal_tier ENUM('S','A','B','C','D') NULL,
  priority TINYINT DEFAULT 0,                     -- 0-10
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id)
);

-- Wishlist / Owned
CREATE TABLE collection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('hero','artifact') NOT NULL,
  target_id INT NOT NULL,
  status ENUM('owned','wishlist','building') DEFAULT 'wishlist',
  quantity TINYINT DEFAULT 1,                     -- số lượng artifact
  note VARCHAR(255),
  UNIQUE KEY unique_target (target_type, target_id)
);

-- Log sync
CREATE TABLE sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('heroes','artifacts','full') NOT NULL,
  status ENUM('success','failed','partial') NOT NULL,
  message TEXT,
  records_affected INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.2. Công việc

- [x] Viết file `database/schema.sql`
- [x] Chạy schema trên MySQL
- [x] Viết script seed dữ liệu mẫu (`database/seed.sql`)

  Evidence:
  - `database/schema.sql` created & executed: PASS
  - 6 tables created (`heroes`, `artifacts`, `hero_artifact_recommendations`, `user_notes`, `collection`, `sync_logs`): PASS
  - `database/seed.sql` populated sample heroes, artifacts, notes, collection: PASS
  - Verification script `node database/verify.js`: PASS
  - Detail evidence log: `docs/verification/phase1-evidence.md`

---

### Giai đoạn 2: Backend API cơ bản (2-3 ngày)

**Mục tiêu:** Xây dựng API RESTful phục vụ frontend.

#### 2.1. Cấu trúc Backend đề xuất

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Kết nối MySQL (mysql2/promise)
│   ├── routes/
│   │   ├── heroes.js
│   │   ├── artifacts.js
│   │   ├── notes.js
│   │   └── collection.js
│   ├── controllers/
│   ├── services/                 # Logic nghiệp vụ
│   └── app.js / server.js
├── scripts/
│   ├── sync-heroes.js
│   ├── sync-artifacts.js
│   └── full-sync.js
└── package.json
```

#### 2.2. Các API cần có (MVP)

**Heroes**
- `GET /api/heroes` — danh sách + filter (element, class, rarity, search)
- `GET /api/heroes/:key` — chi tiết 1 hero
- `GET /api/heroes/:key/recommendations` — artifact đề xuất

**Artifacts**
- `GET /api/artifacts` — danh sách + filter
- `GET /api/artifacts/:key` — chi tiết

**Notes & Collection (cá nhân)**
- `GET /api/notes?target_type=hero&target_id=1`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/collection`
- `POST /api/collection`
- `PUT /api/collection/:id`

#### 2.3. Công việc

- [x] Setup Express + middleware (cors, dotenv, error handler)
- [x] Viết connection pool MySQL (`backend/src/config/db.js`)
- [x] Implement các route cơ bản (Heroes, Artifacts, Notes, Collection)
- [x] Test tự động tất cả API bằng Supertest (`npm test`)
- [x] Thêm pagination + sorting cho danh sách Heroes và Artifacts

  Evidence:
  - Express server `backend/src/app.js` & connection pool created: PASS
  - Heroes APIs (`GET /api/heroes`, `:key`, `:key/recommendations`): PASS
  - Artifacts APIs (`GET /api/artifacts`, `:key`): PASS
  - Notes CRUD APIs (`GET`, `POST`, `PUT`, `DELETE /api/notes`): PASS
  - Collection CRUD APIs (`GET`, `POST`, `PUT`, `DELETE /api/collection`): PASS
  - Automated tests (`npm test`): 10/10 PASS
  - Detail evidence log: `docs/verification/phase2-evidence.md`

---

### Giai đoạn 3: Hệ thống Sync / Scraper (3-5 ngày)

**Mục tiêu:** Có khả năng cập nhật dữ liệu từ epic7db hoặc nguồn community.

#### 3.1. Chiến lược lấy data (ưu tiên)

1. **Ưu tiên cao:** Sử dụng community JSON (nếu còn maintain tốt)
   - Ví dụ: `e7-sidekick-resources` hoặc các repo tương tự
2. **Chính:** Scrape epic7db.com
   - Danh sách: `/heroes`, `/artifacts`
   - Detail: `/heroes/{slug}`, `/artifacts/{slug}`
3. Kết hợp: JSON làm base + scrape bổ sung phần recommended / skill description mới nhất

#### 3.2. Quy tắc Scrape an toàn

- Rate limit: tối thiểu 2-3 giây / request
- User-Agent giả lập trình duyệt thật
- Chỉ chạy thủ công hoặc cron vào giờ thấp điểm
- Lưu raw HTML / JSON tạm để debug khi structure thay đổi
- Có cơ chế retry + log lỗi chi tiết

#### 3.3. Script cần viết

- `scripts/sync-heroes.js`
  - Lấy danh sách → scrape từng trang detail → upsert vào bảng `heroes`
- `scripts/sync-artifacts.js`
- `scripts/full-sync.js` (chạy cả 2 + ghi log)
- Hàm helper: `upsertHero()`, `parseHeroPage()`, `saveImage()` (tùy chọn)

#### 3.4. Công việc

- [x] Phân tích cấu trúc HTML của epic7db
- [x] Viết parser cho danh sách và trang detail (`backend/scripts/parser.js`)
- [x] Implement upsert logic dựa trên `key_name` (`ON DUPLICATE KEY UPDATE`)
- [x] Thêm logging tự động vào bảng `sync_logs`
- [x] Test thành công sync 5 hero và 5 artifact mẫu (`npm run sync`)

  Evidence:
  - Cheerio parser `backend/scripts/parser.js`: PASS
  - Hero sync `backend/scripts/sync-heroes.js` (5 heroes synced): PASS
  - Artifact sync `backend/scripts/sync-artifacts.js` (5 artifacts synced): PASS
  - Full pipeline `npm run sync` (`backend/scripts/full-sync.js`): PASS
  - DB verification (8 heroes, 6 artifacts, `sync_logs` logged): PASS
  - Detail evidence log: `docs/verification/phase3-evidence.md`

---

### Giai đoạn 4: Frontend (4-6 ngày)

**Mục tiêu:** Giao diện sạch, dễ dùng, tập trung vào tra cứu nhanh.

#### 4.1. Cấu trúc Frontend

```
frontend/
├── index.html
├── css/
│   └── style.css                 # hoặc Tailwind
├── js/
│   ├── app.js
│   ├── api.js                    # fetch wrapper
│   ├── heroes.js
│   ├── artifacts.js
│   └── components/               # nếu dùng Alpine/HTMX
├── pages/                        # hoặc SPA đơn giản
└── assets/
```

#### 4.2. Các trang / màn hình chính

1. **Dashboard / Home**
   - Search bar lớn
   - Filter nhanh (Element, Class, Rarity)
   - Thống kê nhanh (số hero owned, wishlist…)

2. **Heroes List**
   - Grid / Table view
   - Filter + Search realtime
   - Badge Owned / Wishlist

3. **Hero Detail**
   - Ảnh + thông tin cơ bản
   - Stats table
   - Skills
   - Recommended Artifacts
   - Phần Note cá nhân + Tier cá nhân
   - Nút đánh dấu Owned / Wishlist

4. **Artifacts List + Detail** (tương tự)

5. **Compare** (có thể làm sau)
   - Chọn 2-4 hero hoặc artifact để so sánh

6. **My Collection / Wishlist**
   - Danh sách đã đánh dấu

#### 4.3. UI/UX ưu tiên

- Dark mode (rất quan trọng với game)
- Responsive cơ bản (desktop ưu tiên, mobile dùng được)
- Loading state + empty state rõ ràng
- Keyboard friendly (search focus)

#### 4.4. Công việc

- [x] Thiết kế layout cơ bản (Dark mode, glassmorphism header + main grid)
- [x] Implement trang danh sách Heroes + filter (Element, Class, Rarity, Search)
- [x] Implement trang chi tiết Hero (Modal với Stats, Skills, Recommended Artifacts)
- [x] Làm tương tự cho Artifacts (`frontend/js/artifacts.js`)
- [x] Tích hợp Note cá nhân + Personal Tier (S/A/B/C/D) + Collection (Owned/Wishlist)
- [x] Thêm Dark mode mặc định (Dark Obsidian & RPG Game Palette)
- [x] Tối ưu trải nghiệm (Debounce search, hotkey `Ctrl+K`, animation card transitions)

  Evidence:
  - Frontend SPA structure (`frontend/index.html`, `style.css`, `app.js`, `api.js`, `heroes.js`, `artifacts.js`, `collection.js`): PASS
  - Express static file serving at `http://localhost:3000`: PASS
  - All automated tests (`npm test`): 15/15 PASS
  - Detail evidence log: `docs/verification/phase4-evidence.md`

---

### Giai đoạn 5: Tính năng cá nhân nâng cao (2-4 ngày)

- [x] Personal Tier List Board (`GET /api/tierlist` & `frontend/js/tierlist.js`)
- [x] So sánh Hero (`frontend/js/compare.js`)
- [x] Export / Import notes & collection dạng JSON (`/api/backup/export`, `/api/backup/import` & `frontend/js/backup.js`)
- [x] Trang thống kê cá nhân (`GET /api/stats` & `frontend/js/stats.js`)

  Evidence:
  - Tier List Board (`/api/tierlist` & UI board): PASS
  - Hero Comparison Tool (`frontend/js/compare.js`): PASS
  - Data Backup & Restore (`/api/backup/export`, `/api/backup/import`): PASS
  - Analytics & Stats (`/api/stats` & progress bar UI): PASS
  - All automated tests (`npm test`): 18/18 PASS
  - Detail evidence log: `docs/verification/phase5-evidence.md`

---

### Giai đoạn 6: Hoàn thiện & Bảo trì

- [x] Thêm script `npm run sync` và `npm run dev`
- [x] Dual-Source Sync Pipeline hợp nhất 2 nguồn dữ liệu (epic7db + CeciliaBot/Smilegate Official)
- [x] Tái thiết kế Gacha Avatar Portrait Frame layout (khung tròn 96px, viền glow theo Hệ, 0% méo vỡ ảnh)
- [x] Tách 2 trang chi tiết Hero và Artifact thành file JS riêng (`hero-detail.js`, `artifact-detail.js`)
- [x] Nâng cấp Tier List đa chế độ (General, PvE, PvP, Guild War) + Drag & Drop + Popover chọn nhanh
- [x] Chuyển đổi Class Restriction của Artifact từ 'General' thành 'Common'
- [x] Ghi nhớ toàn bộ quá trình thực hiện vào `docs/session_summary_2026-08-12.md`

  Evidence:
  - Session Summary Documentation: `docs/session_summary_2026-08-12.md` PASS
  - Dual-Source Sync (`npm run sync`): PASS (385 Heroes, 280 Artifacts synced)
  - All automated tests (`npm test`): PASS (18/18 PASS)

---

## 3. Cấu trúc thư mục dự án đề xuất (hoàn chỉnh)

```
epic7-personal-db/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── app.js
│   ├── scripts/
│   │   ├── sync-heroes.js
│   │   ├── sync-artifacts.js
│   │   └── full-sync.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   └── screenshots/
├── .gitignore
├── README.md
└── package.json                  # root (optional)
```

---

## 4. Roadmap thời gian ước tính (làm part-time)

| Giai đoạn              | Thời gian ước tính | Ưu tiên |
|------------------------|--------------------|--------|
| 0. Chuẩn bị            | 1 ngày             | Cao    |
| 1. Database            | 1 ngày             | Cao    |
| 2. Backend API         | 2-3 ngày           | Cao    |
| 3. Scraper / Sync      | 3-5 ngày           | Cao    |
| 4. Frontend cơ bản     | 4-6 ngày           | Cao    |
| 5. Tính năng cá nhân   | 2-4 ngày           | Trung bình |
| 6. Hoàn thiện          | 1-2 ngày           | Cao    |

**Tổng MVP (có thể dùng được):** khoảng 12-18 ngày làm việc part-time.

---

## 5. Rủi ro & Cách giảm thiểu

| Rủi ro                          | Mức độ | Cách xử lý |
|--------------------------------|--------|----------|
| epic7db thay đổi HTML structure | Cao    | Lưu raw HTML, viết parser linh hoạt, có log lỗi rõ |
| Rate limit / bị chặn            | Trung bình | Rate limit mạnh + User-Agent thật + chỉ sync thủ công |
| Dữ liệu community JSON lỗi thời | Trung bình | Ưu tiên scrape epic7db làm nguồn chính |
| Quá tham vọng tính năng         | Cao    | Làm theo thứ tự MVP → mở rộng sau |

---

## 6. Tiêu chí hoàn thành MVP

Website được coi là **MVP hoàn thành** khi:

- [x] Có thể xem danh sách và chi tiết Hero + Artifact
- [x] Có thể filter + search cơ bản
- [x] Có thể thêm / sửa note cá nhân
- [x] Có thể đánh dấu Owned / Wishlist
- [x] Có script sync dữ liệu từ epic7db (hoặc JSON community) chạy được
- [x] Giao diện đẹp, dark mode, dùng ổn trên desktop

---

## 7. Bước tiếp theo ngay sau khi có plan này

1. Tạo repository / thư mục dự án
2. Viết `database/schema.sql` và chạy thử
3. Setup backend cơ bản + kết nối MySQL thành công
4. Viết script sync 5-10 hero đầu tiên để kiểm chứng parser

---

**Ghi chú cuối:**  
Đây là dự án cá nhân → đừng cầu toàn quá sớm. Ưu tiên có cái dùng được trước, sau đó mới tinh chỉnh scraper và thêm tính năng hay.

Chúc bạn xây dựng vui vẻ!  
Nếu cần mình viết tiếp file schema.sql chi tiết hoặc skeleton code backend, cứ nói nhé.