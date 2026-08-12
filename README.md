# Epic7 Personal DB (Epic7-Hub)

> **Website cá nhân tổng hợp thông tin Hero, Artifact, Note & Collection cho game Epic Seven.**

![Epic7-Hub Tech Stack](https://img.shields.io/badge/Node.js-v24-green)
![Express](https://img.shields.io/badge/Express-v5-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![Tests](https://img.shields.io/badge/Tests-18%2F18%20PASS-brightgreen)

---

## 🌟 Tính năng chính (MVP Features)

1. **Dashboard & Search realtime:**
   - Tra cứu nhanh Hero & Artifact với thanh tìm kiếm hỗ trợ phím tắt `Ctrl+K`.
   - Lọc đa dạng theo Element (Fire, Ice, Earth, Light, Dark), Class (Warrior, Knight, Thief, Ranger, Mage, Soul Weaver) và Rarity (3★, 4★, 5★).
   - Thống kê nhanh tổng số Hero, Artifact, số lượng đã sở hữu và Wishlist.

2. **Chi tiết Hero & Artifact (Modal View):**
   - Xem chỉ số gốc (Base Stats: ATK, HP, DEF, SPD), danh sách Skill và Artifacts đề xuất.
   - Thêm / sửa Ghi chú cá nhân (Personal Notes) & Xếp loại Tier cá nhân (S, A, B, C, D).
   - Đánh dấu trạng thái bộ sưu tập (`Owned`, `Wishlist`, `Building`).

3. **Bảng Xếp Hạng Cá Nhân (Personal Tier List Board):**
   - Tự động nhóm các Hero theo Tier cá nhân màu sắc (`S`, `A`, `B`, `C`, `D`, `Unranked`).

4. **Công Cụ So Sánh Hero (Hero Comparison Tool):**
   - So sánh trực quan chỉ số 2 Hero song song với chỉ số chênh lệch (cao hơn ▲ / thấp hơn ▼).

5. **Hệ Thống Sync Scraper Dữ Liệu (`npm run sync`):**
   - Tự động cào và cập nhật dữ liệu từ `epic7db.com` với cơ chế Rate-Limiting an toàn (1.5s delay), chống gián đoạn và ghi log chi tiết vào bảng `sync_logs`.

6. **Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore):**
   - 1-click Download Backup file JSON chứa toàn bộ ghi chú và bộ sưu tập.
   - Tải lên file JSON để khôi phục dữ liệu nhanh chóng.

7. **Thống Kê Cá Nhân (Analytics):**
   - Biểu đồ phân bổ Hero theo Element, Class và tỷ lệ sở hữu.

---

## 🛠️ Yêu cầu hệ thống & Môi trường

- **Node.js:** `>= v18.0.0` (Khuyên dùng v20 LTS hoặc v24)
- **MySQL Server:** `>= 8.0` (Chạy service `MySQL80`)
- **Git**

---

## 🚀 Hướng dẫn cài đặt & Chạy Local

### 1. Clone Repository & Cài đặt Dependencies

```bash
git clone <repository-url>
cd Epic7-Hub
npm install
```

### 2. Cấu hình File `.env`

Tạo file `.env` tại thư mục gốc dự án dựa theo mẫu `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=epic7_personal
PORT=3000
```

### 3. Tạo Database & Nạp Schema / Seed Data

Khởi tạo database MySQL `epic7_personal` và nạp cấu trúc bảng + dữ liệu thử nghiệm:

```powershell
# Chạy trong PowerShell (thay password nếu cần)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyour_password -e "CREATE DATABASE IF NOT EXISTS epic7_personal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Nạp Schema & Seed Data
Get-Content database\schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyour_password epic7_personal
Get-Content database\seed.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyour_password epic7_personal
```

Xác minh database đã sẵn sàng bằng script:

```bash
node database/verify.js
```

### 4. Chạy Web App

#### Chế độ Chế độ Phát triển (Dev Mode mit Nodemon):

```bash
npm run dev
```

#### Chế độ Sản xuất (Production Mode):

```bash
npm start
```

Truy cập ứng dụng tại trình duyệt: **`http://localhost:3000`**

---

## 🔄 Hướng dẫn Đồng bộ Dữ liệu (Sync / Scraper)

Dự án cung cấp các lệnh đồng bộ dữ liệu từ `epic7db.com`:

```bash
# Đồng bộ toàn bộ (Heroes + Artifacts)
npm run sync

# Chỉ đồng bộ Heroes (5 heroes/lần chạy)
npm run sync:heroes

# Chỉ đồng bộ Artifacts (5 artifacts/lần chạy)
npm run sync:artifacts
```

Lịch sử đồng bộ được lưu trữ tự động trong bảng `sync_logs`.

---

## 🧪 Chạy Kiểm Thử Tự Động (Automated Test Suite)

Dự án tích hợp bộ kiểm thử tự động toàn diện kiểm tra API REST, Static Serving và Parser Unit Tests:

```bash
npm test
```

**Kết quả kiểm thử:**
- `10/10` REST API Endpoints PASS
- `3/3` Static Frontend Serving PASS
- `2/2` HTML Parser Unit Tests PASS
- `3/3` Phase 5 Advanced Personal Feature APIs PASS

---

## 📂 Cấu trúc Thư mục Dự án

```text
Epic7-Hub/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình DB Pool MySQL
│   │   ├── controllers/     # Heroes, Artifacts, Notes, Collection, Tierlist, Stats, Backup
│   │   ├── routes/          # Express API Endpoints
│   │   ├── app.js           # Express App & Static Serving
│   │   └── server.js        # Entrypoint server.listen
│   ├── scripts/
│   │   ├── parser.js        # Cheerio HTML Parser
│   │   ├── sync-heroes.js   # Script sync heroes
│   │   ├── sync-artifacts.js# Script sync artifacts
│   │   └── full-sync.js     # Script full sync pipeline
│   └── tests/               # Test suites (api, frontend, parser, phase5)
├── frontend/
│   ├── index.html           # SPA HTML Container
│   ├── css/
│   │   └── style.css        # Design System & Dark Theme
│   └── js/
│       ├── api.js           # API Client Wrapper
│       ├── app.js           # Main JS Orchestrator
│       ├── heroes.js        # Heroes Grid & Modal
│       ├── artifacts.js     # Artifacts View & Modal
│       ├── collection.js    # Collection View
│       ├── tierlist.js      # Tier List Board View
│       ├── compare.js       # Hero Comparison Tool
│       ├── stats.js         # Analytics & Statistics View
│       └── backup.js        # Backup Export & Import View
├── database/
│   ├── schema.sql           # Cấu trúc 6 bảng MySQL
│   ├── seed.sql             # Dữ liệu mẫu
│   └── verify.js            # Script kiểm tra kết nối DB
├── docs/
│   ├── plans/               # Kế hoạch chi tiết từng phase (phase 0 -> 5)
│   └── verification/        # Bằng chứng kiểm thử (evidence phase 0 -> 6)
├── plan.md                  # Source of truth tiến độ toàn dự án
├── AGENTS.md                # Quy tắc vận hành AI Agent
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Quy trình Bảo trì & Sao lưu Database (Backup Procedure)

1. **Sao lưu dữ liệu cá nhân (Export JSON):**
   - Truy cập giao diện `http://localhost:3000` -> Tab **💾 Backup** -> Nhấn **Download JSON Backup**.
   - Hoặc gọi API: `GET http://localhost:3000/api/backup/export`.

2. **Sao lưu toàn bộ MySQL Database (`mysqldump`):**

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -pyour_password epic7_personal > epic7_personal_dump.sql
   ```

3. **Khôi phục Database từ file `.sql`:**

   ```powershell
   Get-Content epic7_personal_dump.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyour_password epic7_personal
   ```

---

## 📜 Giấy phép & Sử dụng

Dự án được xây dựng phục vụ mục đích cá nhân tra cứu thông tin game Epic Seven. Thông tin và hình ảnh thuộc bản quyền của Smilegate Megaport / Supercreative.
