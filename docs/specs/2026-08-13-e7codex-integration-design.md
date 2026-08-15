# Design Spec: E7 Codex Artwork Archive & Triple-Source Failover Integration

**Dự án:** Epic7 Personal DB (Epic7-Hub)  
**Ngày lập:** 13/08/2026  
**Trạng thái:** Approved by User  

---

## 1. Mục tiêu
Tích hợp nguồn hình ảnh chất lượng cao từ **E7 Codex Archive** (`https://e7codex.com`) vào hệ thống Epic7-Hub:
- Xây dựng **Triple-Source Failover Pipeline** cho hình ảnh (Source A: `epic7db.com`, Source B: `e7codex.com`, Source C: `ceciliabot.github.io`).
- Thêm tính năng hiển thị **High-Res Full Pose Artwork & Illustration Gallery** trong trang chi tiết Hero Detail và Artifact Detail.
- Cập nhật backend scraper / helper để tự động ánh xạ E7 Codex Asset IDs cho 385+ Heroes và 284+ Artifacts.

---

## 2. Kiến trúc & Data Flow

### 2.1 Backend Data Discovery (`backend/scripts/e7codex-backup.js`)
- Load `https://e7codex.com/data/units.json` (834 units) & `https://e7codex.com/data/artifacts.json` (293 artifacts).
- Ánh xạ theo canonical `slug` (`tamarinne`, `arbiter-vildred`, `3f`, `alexas-basket`...).
- Bổ sung trường `full_artwork_url` và `face_artwork_url` vào dữ liệu Hero & Artifact:
  - Hero Pose URL: `https://e7codex.com/${unit.pose}` (e.g., `https://e7codex.com/assets/c1067/pose.png`)
  - Artifact Full Illustration: `https://e7codex.com/${art.art_full}` (e.g., `https://e7codex.com/assets/_artifacts/art0001_fu.png`)

### 2.2 Database Schema Update (`database/schema.sql`)
Thêm 2 cột cho bảng `heroes` và `artifacts`:
- `heroes.full_artwork_url VARCHAR(500)`
- `artifacts.full_artwork_url VARCHAR(500)`

### 2.3 Frontend Image Failover & Gallery (`frontend/js/`)
1. **List Card Views (`heroes.js`, `artifacts.js`, `tierlist.js`):**
   - Giữ nguyên ảnh đại diện WebP siêu nhẹ (`~5KB`) làm ảnh mặc định để đảm bảo load mượt.
   - Thêm fallback 3 lớp tự động nếu ảnh lỗi:
     - Priority 1: `epic7db.com/images/...`
     - Priority 2: `e7codex.com/assets/...`
     - Priority 3: Dark Obsidian SVG Placeholder (`⚔️` / `💎`)
2. **Detail Views & Modals (`hero-detail.js`, `artifact-detail.js`):**
   - Bổ sung phần **"🎨 Full HD Artwork & Pose Archive"**:
     - Hiển thị ảnh Full Body Pose / High-Res Illustration sắc nét.
     - Tích hợp nút xem ảnh kích thước thật (Full-screen Lightbox view).

---

## 3. Kế hoạch Verification
- **Unit Tests:** Viết unit test mới kiểm tra E7 Codex Key & Artwork Discovery (`backend/tests/e7codex.test.js`).
- **Integration Test (`npm test`):** Đảm bảo tất cả 20+ automated tests PASS 100%.
- **Database verification:** Kiểm tra schema migration và data mapping.
