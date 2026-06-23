# TỔNG QUAN VÀ PHÂN TÍCH KIẾN TRÚC DỰ ÁN

## 📌 Website Tạo Đề Thi & Làm Bài Trắc Nghiệm (VuaQuiz / Examora)

> **Ngày cập nhật:** 22/06/2026 (Đã cập nhật cấu trúc: Thư mục dự án đổi thành `Examora`, `GiaoDienWebsiteLamBaiTest2026` đổi thành `Frontend`, `BackendWebsiteLamBaiTestTracNghiem` đổi thành `Backend`)
> **Phiên bản:** 1.0

---

## 1. GIỚI THIỆU TỔNG QUAN

Dự án **"Website Tạo Đề Thi Làm Bài Trắc Nghiệm"** (tên thương mại: **VuaQuiz**) là một hệ thống web fullstack phục vụ việc quản lý lớp học, tạo đề thi trắc nghiệm, và cho phép học sinh làm bài thi trực tuyến. Hệ thống hỗ trợ 3 vai trò người dùng: **Admin**, **Giáo viên**, **Học sinh** với các quyền hạn khác nhau.

### Mục tiêu chính:
- Giáo viên có thể tạo lớp học, soạn bài giảng kèm câu hỏi trắc nghiệm
- Học sinh có thể tham gia lớp, mua bài giảng và làm bài thi online
- Admin quản lý toàn bộ hệ thống (người dùng, phân quyền)
- Hỗ trợ import câu hỏi từ file Word (.docx)
- Theo dõi lịch sử thi và thống kê kết quả

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1. Mô hình kiến trúc

Dự án sử dụng kiến trúc **Client-Server (Monolithic REST API)** với mô hình **SPA (Single Page Application)**:

```
┌─────────────────────────────────┐
│       FRONTEND (React SPA)      │
│    Vite + React 18 + Ant Design │
│         Port: 2004              │
│                                 │
│  ┌───────────┐  ┌─────────────┐ │
│  │  Pages    │  │ Components  │ │
│  │  ├ Login  │  │ ├ Header    │ │
│  │  ├ Home   │  │ ├ Sidebar   │ │
│  │  ├ Admin  │  │ ├ Protected │ │
│  │  └ HocSinh│  │ └ Layout    │ │
│  └───────────┘  └─────────────┘ │
│         │                       │
│  ┌──────┴───────┐               │
│  │  Services    │               │
│  │  (API Calls) │               │
│  └──────┬───────┘               │
└─────────┼───────────────────────┘
          │ HTTP REST API + WebSocket
          │ (Axios / Fetch + Socket.io-client)
          ▼
┌─────────────────────────────────┐
│       BACKEND (Node.js)         │
│    Express.js + Socket.io       │
│         Port: 8821              │
│                                 │
│  ┌───────────┐  ┌─────────────┐ │
│  │  Routes   │  │ Controllers │ │
│  │  (11 file)│  │ (6 thư mục) │ │
│  └───────────┘  └─────────────┘ │
│  ┌───────────┐  ┌─────────────┐ │
│  │Middlewares│  │   Models    │ │
│  │(Auth+Role)│  │ (8 schema)  │ │
│  └───────────┘  └─────────────┘ │
│         │                       │
└─────────┼───────────────────────┘
          │ Mongoose ODM
          ▼
┌─────────────────────────────────┐
│     DATABASE (MongoDB Atlas)    │
│  mongodb+srv://...mongodb.net   │
│  Database: WebsiteTest2026      │
│  Collections: 9+                │
└─────────────────────────────────┘
```

### 2.2. Tổng quan công nghệ sử dụng

| Thành phần        | Công nghệ                                   |
|--------------------|----------------------------------------------|
| **Frontend**       | React 18 + Vite 7                           |
| **Backend**        | Node.js + Express.js 4                      |
| **Database**       | MongoDB Atlas (Cloud) + Mongoose 9          |
| **Realtime**       | Socket.io (Server + Client)                  |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs                |
| **Deployment FE**  | Vercel                                       |
| **Deployment BE**  | VPS (PM2 + Nginx reverse proxy)              |
| **Email Service**  | Nodemailer (Gmail SMTP)                      |
| **Telegram Bot**   | Telegraf (thông báo & phê duyệt)            |
| **AI Integration** | OpenAI API (GPT)                             |

---

## 3. PHÂN TÍCH BACKEND CHI TIẾT

### 3.1. Ngôn ngữ & Runtime
- **Ngôn ngữ:** JavaScript (CommonJS - `require/module.exports`)
- **Runtime:** Node.js
- **Framework:** Express.js v4.21.2

### 3.2. Cấu trúc thư mục Backend

```
BackendWebsiteLamBaiTestTracNghiem/
├── src/
│   ├── server.js            # Entry point - Khởi tạo HTTP Server + Socket.io
│   ├── app.js               # Express App - Middleware, CORS, Routes
│   ├── config/
│   │   ├── connectDB.js     # Kết nối MongoDB Atlas (Mongoose)
│   │   ├── viewEngine.js    # EJS View Engine
│   │   ├── uploadImage.js   # Multer config cho upload ảnh
│   │   ├── uploadVideo.js   # Multer config cho upload video
│   │   ├── uploadAudio.js   # Multer config cho upload audio
│   │   ├── uploadDocument.js# Multer config cho upload tài liệu
│   │   └── uploadFileWord.js# Multer config cho upload file Word
│   ├── models/
│   │   ├── NguoiDung.js     # Schema người dùng (User)
│   │   ├── LopHoc.js        # Schema lớp học
│   │   ├── BaiGiang.js      # Schema bài giảng + câu hỏi trắc nghiệm
│   │   ├── KetQuaBaiThi.js  # Schema kết quả bài thi
│   │   ├── LichSuLamBai.js  # Schema lịch sử làm bài (snapshot)
│   │   ├── BaiGiangDaMua.js # Schema bài giảng đã mua
│   │   ├── MonHoc.js        # Schema môn học (chưa sử dụng)
│   │   └── OtpStorage.js    # Schema lưu OTP tạm (TTL: 5 phút)
│   ├── controllers/
│   │   ├── auth/            # Xác thực (đăng ký, đăng nhập, OTP, quên MK)
│   │   ├── baigiang/        # CRUD bài giảng, thương mại, lịch sử thi
│   │   ├── lophoc/          # CRUD lớp học, phê duyệt học viên
│   │   ├── nguoidung/       # CRUD người dùng (Admin)
│   │   ├── admin/           # Quản lý người dùng nâng cao (Admin)
│   │   └── uploads/         # Upload file (ảnh, video, audio, tài liệu)
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Xác thực JWT + kiểm tra token DB
│   │   ├── authMiddlewareFull.js# Phân quyền theo role (checkRole)
│   │   └── adminMiddleware.js   # Middleware kiểm tra quyền Admin
│   ├── routes/
│   │   ├── authRouter.js
│   │   ├── baiGiangRoutes.js
│   │   ├── baiGiangThuongMaiRoutes.js
│   │   ├── lopHocRoutes.js
│   │   ├── lichSuThiRoutes.js
│   │   ├── nguoiDungRoutes.js
│   │   ├── quanLyNguoiDungRoutes.js
│   │   ├── uploadImageRoute.js
│   │   ├── uploadVideoRoute.js
│   │   ├── uploadAudioRoute.js
│   │   └── uploadDocumentRoute.js
│   ├── services/
│   │   ├── telegramService.js     # Gửi thông báo qua Telegram Bot
│   │   ├── deThiTelegramService.js# Gửi đề thi qua Telegram
│   │   └── botConfig.js           # Cấu hình Telegram Bot
│   └── utils/
│       ├── generateToken.js  # Tạo JWT token
│       └── randomCode.js     # Sinh mã lớp ngẫu nhiên
├── public/
│   └── uploads/              # Thư mục lưu file upload (ảnh, video, docs)
├── .env                      # Biến môi trường
└── package.json
```

### 3.3. Thư viện Backend chính (Dependencies)

| Thư viện               | Version  | Mục đích sử dụng                                         |
|--------------------------|----------|-----------------------------------------------------------|
| `express`                | 4.21.2   | Framework web chính                                       |
| `mongoose`               | 9.0.2    | ODM cho MongoDB, định nghĩa schema và truy vấn           |
| `jsonwebtoken`           | 9.0.3    | Tạo và xác thực JWT access token                          |
| `bcryptjs`               | 3.0.3    | Hash mật khẩu người dùng                                  |
| `cors`                   | 2.8.5    | Xử lý Cross-Origin Resource Sharing                       |
| `dotenv`                 | 17.2.3   | Đọc biến môi trường từ file `.env`                        |
| `multer`                 | 2.0.2    | Upload file (ảnh, video, audio, tài liệu)                |
| `nodemailer`             | 8.0.1    | Gửi email OTP đăng ký và khôi phục mật khẩu              |
| `socket.io`              | 4.8.3    | WebSocket realtime (thông báo, cập nhật dữ liệu live)    |
| `mammoth`                | 1.11.0   | Đọc và parse file Word (.docx) thành HTML/text            |
| `cheerio`                | 1.2.0    | Parse HTML (hỗ trợ phát hiện bold/đáp án đúng từ Word)   |
| `openai`                 | 6.15.0   | Tích hợp OpenAI API (GPT) - hỗ trợ AI                    |
| `telegraf`               | 4.16.3   | Telegram Bot SDK - gửi thông báo, phê duyệt              |
| `cookie-parser`          | 1.4.7    | Parse cookie từ request                                    |
| `crypto-js`              | 4.2.0    | Mã hóa/giải mã dữ liệu (AES)                             |
| `helmet`                 | 8.1.0    | Bảo mật HTTP headers                                      |
| `express-rate-limit`     | 8.2.1    | Rate limiting chống DDoS/spam                             |
| `express-validator`      | 7.3.1    | Validate dữ liệu đầu vào                                  |
| `morgan`                 | 1.10.1   | HTTP request logger                                        |
| `xlsx`                   | 0.18.5   | Đọc/ghi file Excel                                         |
| `jszip`                  | 3.10.1   | Nén/giải nén file ZIP                                      |
| `ejs`                    | 3.1.10   | Template engine (View Engine)                               |
| `xss-clean`              | 0.1.4    | Chống tấn công XSS                                         |
| `axios`                  | 1.15.0   | HTTP client (gọi API bên ngoài)                            |
| `sitemap`                | 9.0.1    | Tạo sitemap cho SEO                                        |

### 3.4. Dev Dependencies

| Thư viện    | Mục đích                        |
|-------------|----------------------------------|
| `nodemon`   | Hot-reload server khi phát triển |
| `eslint`    | Linting code                     |
| `prettier`  | Format code                      |

### 3.5. Database - MongoDB Atlas

- **Loại:** MongoDB (NoSQL - Document Database)
- **Hosting:** MongoDB Atlas (Cloud)
- **Connection:** `mongodb+srv://...@webtaodethilamtracnghie.0vwqlck.mongodb.net/WebsiteTest2026`
- **ODM:** Mongoose v9.0.2
- **Cấu hình kết nối:**
  - `maxPoolSize: 10` (giới hạn connection pool)
  - `serverSelectionTimeoutMS: 10000`
  - `socketTimeoutMS: 45000`
  - DNS fallback: Google DNS (8.8.8.8, 8.8.4.4) + Cloudflare (1.1.1.1)
  - Ép dùng IPv4 (`family: 4`)
  - Auto-reconnect khi mất kết nối

#### Sơ đồ Database (Collections & Schema):

```
WebsiteTest2026 (Database)
│
├── nguoidungs          ← NguoiDung Schema
│   ├── ma_so           (String, unique) - MSSV hoặc Mã GV
│   ├── ho_ten          (String, required)
│   ├── email           (String, unique, required)
│   ├── so_dien_thoai   (String, required)
│   ├── mat_khau        (String, bcrypt hash)
│   ├── role            (Enum: 'admin' | 'giaovien' | 'hocsinh')
│   ├── ten_lop_sinh_hoat (String)
│   ├── anh_dai_dien    (String)
│   ├── gioiThieu       (String)
│   ├── trang_thai_hoat_dong (Boolean)
│   ├── soDu            (Number) - Số dư tài khoản
│   ├── maOTP           (String)
│   ├── isActive         (Boolean)
│   └── currentToken     (String) - Token hiện tại (single session)
│
├── lophocs             ← LopHoc Schema
│   ├── maKey           (String, unique, auto-generated hex)
│   ├── ten_lop         (String, required)
│   ├── anh_lop         (String)
│   ├── ma_lop_random   (String, unique) - Mã để SV nhập tham gia
│   ├── id_giaovien     (ObjectId → NguoiDung)
│   ├── danh_sach_hoc_vien [{
│   │   ├── id_hoc_vien      (ObjectId → NguoiDung)
│   │   ├── trang_thai_phe_duyet (Enum: 'cho_phe_duyet'|'da_tham_gia'|'bi_tu_choi')
│   │   └── ngay_vao_lop     (Date)
│   │ }]
│   ├── mo_ta_lop       (String)
│   ├── si_so_toi_da    (Number, default: 100)
│   └── ngay_bat_dau    (Date)
│
├── baigiangs           ← BaiGiang Schema
│   ├── maBaiGiang      (String, unique, auto-generated hex)
│   ├── id_lop_hoc      (ObjectId → LopHoc)
│   ├── ten_bai_giang   (String, required)
│   ├── anhDaiDien      (String)
│   ├── gioiThieu       (String)
│   ├── noi_dung_bai_hoc (String) - Nội dung HTML soạn thảo
│   ├── danhSachCauHoi  [{
│   │   ├── noiDungCauHoi    (String)
│   │   ├── cacDapAn [{
│   │   │   ├── noiDungDapAn (String)
│   │   │   └── laDapAnDung (Boolean)
│   │   │ }]
│   │   └── giaiThich       (String)
│   │ }]
│   ├── thoi_gian_lam_bai (Number, phút, default: 15)
│   ├── giaBaiGiang     (Number, default: 0)
│   └── ngay_tao        (Date)
│
├── ketquabaithis       ← KetQuaBaiThi Schema
│   ├── id_hoc_sinh     (ObjectId → NguoiDung)
│   ├── id_bai_giang    (ObjectId → BaiGiang)
│   ├── id_giao_vien    (ObjectId → NguoiDung)
│   ├── id_lop_hoc      (ObjectId → LopHoc)
│   ├── lan_thi         (Number)
│   ├── thoi_gian_lam_bai (Number, giây)
│   ├── ngay_lam_bai    (Date)
│   ├── so_cau_dung     (Number)
│   ├── tong_so_cau     (Number)
│   ├── diem            (Number, thang 10)
│   ├── chi_tiet_dap_an [{
│   │   ├── id_cau_hoi  (ObjectId)
│   │   ├── dap_an_chon (String: A|B|C|D|null)
│   │   ├── dap_an_dung (String: A|B|C|D)
│   │   └── dung_sai    (Boolean)
│   │ }]
│   └── trang_thai      (Enum: 'dang_lam'|'da_nop_bai'|'da_xem_dap_an')
│
├── lichsulamsbais      ← LichSuLamBai Schema (Snapshot)
│   ├── id_hoc_vien     (ObjectId → NguoiDung)
│   ├── id_lop_hoc      (ObjectId → LopHoc)
│   ├── id_bai_giang_goc(ObjectId → BaiGiang)
│   ├── tieu_de_snapshot (String)
│   ├── noi_dung_bai_hoc_snapshot (String)
│   ├── du_lieu_cau_hoi_snapshot  (Array)
│   ├── tra_loi_cua_user [{...}]
│   └── thong_so_diem   { so_cau_dung, tong_so_cau, diem_so, thoi_gian_lam_bai_giay }
│
├── baigiangdamuas      ← BaiGiangDaMua Schema
│   ├── id_hoc_sinh     (ObjectId → NguoiDung)
│   ├── id_bai_giang    (ObjectId → BaiGiang)
│   ├── id_giao_vien    (ObjectId → NguoiDung)
│   ├── id_lop_hoc      (ObjectId → LopHoc)
│   ├── so_tien_da_thanh_toan (Number)
│   ├── ngay_mua        (Date)
│   └── trang_thai      (Enum: 'da_mua'|'dang_hoc'|'da_hoan_thanh')
│
├── otpstorages         ← OtpStorage Schema (TTL: 5 phút)
│   ├── email           (String)
│   ├── otp             (String)
│   └── createdAt       (Date, expires: 300s)
│
└── monhocs             ← MonHoc Schema (chưa sử dụng chính thức)
```

---

## 4. PHÂN TÍCH FRONTEND CHI TIẾT

### 4.1. Ngôn ngữ & Framework
- **Ngôn ngữ:** JavaScript (ESM - `import/export`)
- **Framework:** React 18.3.1
- **Build Tool:** Vite 7.1.1
- **Package Manager:** npm

### 4.2. Cấu trúc thư mục Frontend

```
GiaoDienWebsiteLamBaiTest2026/
├── src/
│   ├── main.jsx              # Entry point - ReactDOM.createRoot
│   ├── App.jsx               # Root component - RouterProvider
│   ├── router.jsx            # React Router v6 - Định nghĩa routes
│   ├── layout.css            # CSS layout chung
│   ├── pages/
│   │   ├── Login/            # Trang đăng nhập/đăng ký
│   │   ├── Home/             # Trang chủ (Dashboard)
│   │   ├── Admin/
│   │   │   ├── Classes/      # Quản lý lớp học
│   │   │   │   └── BaiGiang/ # Quản lý bài giảng trong lớp
│   │   │   ├── TaiKhoanCuaToi/ # Trang cá nhân
│   │   │   ├── QuanLyTaiKhoan/ # Admin: Quản lý tài khoản
│   │   │   └── LichSuThi/   # Xem lịch sử thi
│   │   ├── HocSinh/
│   │   │   ├── BoSuuTap/    # Bộ sưu tập bài giảng đã mua
│   │   │   └── LamBai/      # Giao diện làm bài thi
│   │   └── PageAdmin/
│   │       └── ForbiddenPage/ # Trang 403 - Không có quyền
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout/ # Layout chính (Header + Sidebar + Content)
│   │   ├── ProtectedRoute/      # Route bảo vệ đăng nhập
│   │   ├── HeaderApp/           # Header ứng dụng
│   │   ├── FooterApp/           # Footer
│   │   ├── AuthModal/           # Modal đăng nhập/đăng ký
│   │   ├── NotFound/            # Trang 404
│   │   ├── PageTitle/           # Component đặt title trang
│   │   ├── ThemeSwitcher/       # Chuyển đổi theme sáng/tối
│   │   ├── ChanF12/             # Chặn F12 Dev Tools
│   │   └── PublicRoute/         # Route công khai
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Context quản lý xác thực toàn cục
│   │   └── FavoritesContext.jsx # Context quản lý yêu thích
│   ├── services/
│   │   ├── apiTongQuat.js       # Base API fetch wrapper
│   │   ├── apiAuth.js           # API xác thực
│   │   ├── apiBaiGiang.js       # API bài giảng (13 hàm)
│   │   ├── apiLopHoc.js         # API lớp học (8 hàm)
│   │   ├── apiLichSuThi.js      # API lịch sử thi
│   │   ├── apiQuanLyNguoiDung.js# API quản lý người dùng (Admin)
│   │   ├── baiGiangThuongMaiAPI.js # API thương mại (mua bài, làm bài)
│   │   ├── uploadAPI.js         # API upload file
│   │   ├── nguoiDungService.js  # Service người dùng
│   │   └── baiVietHayService.js # Service bài viết
│   ├── hook/
│   │   └── useSocket.js         # Custom hook kết nối Socket.io
│   ├── config/
│   │   └── rolePermissions.js   # Cấu hình quyền truy cập theo role
│   ├── utils/
│   │   ├── auth.js              # Helper xác thực
│   │   ├── axios-customize.js   # Cấu hình Axios instance
│   │   ├── cryptoHelper.js      # Mã hóa/giải mã AES (CryptoJS)
│   │   ├── formatContent.js     # Format nội dung
│   │   ├── formatURL.js         # Format URL
│   │   ├── getProductLink.js    # Lấy link sản phẩm
│   │   └── scrollUtils.js       # Tiện ích cuộn trang
│   └── assets/                  # Tài nguyên tĩnh (ảnh, icon, font)
├── public/
├── dist/                        # Build output
├── index.html                   # HTML template
├── vite.config.js               # Cấu hình Vite
├── vercel.json                  # Cấu hình deploy Vercel
├── .env                         # Biến môi trường
└── package.json
```

### 4.3. Thư viện Frontend chính (Dependencies)

#### UI & Design:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `antd` v5.24.1            | UI Component Library chính (Table, Form, Modal, etc.) |
| `@ant-design/icons`       | Bộ icon Ant Design                                    |
| `@ant-design/plots`       | Biểu đồ Ant Design                                   |
| `bootstrap` v5.3.3        | CSS Framework bổ trợ                                   |
| `react-bootstrap`         | Bootstrap components cho React                         |
| `styled-components`       | CSS-in-JS styling                                      |
| `lucide-react`            | Bộ icon Lucide                                          |
| `react-icons`             | Bộ icon React đa dạng                                  |
| `framer-motion`           | Animation library                                       |
| `react-transition-group`  | Hiệu ứng chuyển cảnh                                   |
| `classnames`              | Quản lý className động                                  |

#### State Management & Routing:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `react-router-dom` v6.9   | Routing SPA                                           |
| `@reduxjs/toolkit`        | Redux state management (có nhưng chủ yếu dùng Context)|
| `react-redux`             | Kết nối Redux với React                                |
| `redux-persist`           | Persist Redux state                                    |

#### Form & Validation:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `formik`                  | Form handling                                          |
| `yup`                     | Schema validation                                      |

#### HTTP & Realtime:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `axios` v1.3.4            | HTTP client (cấu hình interceptor)                    |
| `socket.io-client`        | WebSocket client kết nối realtime                     |

#### Biểu đồ & Data Visualization:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `chart.js`                | Thư viện biểu đồ                                      |
| `react-chartjs-2`         | Wrapper Chart.js cho React                             |
| `recharts`                | Alternative chart library cho React                    |

#### Rich Text Editor:
| Thư viện                        | Mục đích                                         |
|---------------------------------|--------------------------------------------------|
| `@ckeditor/ckeditor5-react`     | CKEditor 5 React integration                    |
| `@ckeditor/ckeditor5-build-classic` | CKEditor Classic build                      |
| `@tinymce/tinymce-react`        | TinyMCE Rich text editor                        |

#### Tiện ích khác:
| Thư viện                  | Mục đích                                              |
|---------------------------|-------------------------------------------------------|
| `crypto-js`               | Mã hóa/giải mã AES dữ liệu                          |
| `jwt-decode`              | Decode JWT token ở client                              |
| `bcryptjs-react`          | Hash password ở client (trước khi gửi)                |
| `dayjs` / `moment`        | Xử lý ngày tháng                                      |
| `i18next` + `react-i18next`| Đa ngôn ngữ (i18n)                                  |
| `slugify`                 | Tạo slug từ chuỗi                                     |
| `uuid`                    | Sinh UUID                                              |
| `xlsx`                    | Đọc/ghi Excel ở client                                |
| `html-react-parser`       | Parse HTML thành React components                     |
| `react-copy-to-clipboard` | Copy text vào clipboard                                |
| `lottie-react` / `@lottiefiles/react-lottie-player` | Animation Lottie         |
| `react-slick` + `slick-carousel` | Image/content slider                          |
| `react-image-gallery`     | Gallery ảnh                                            |
| `react-custom-roulette`   | Vòng quay may mắn                                      |
| `react-dark-mode-toggle`  | Toggle dark/light mode                                 |
| `react-spinners`          | Loading spinners                                        |
| `smooth-scrollbar`        | Custom scrollbar                                        |
| `@react-google-maps/api`  | Google Maps integration                                |
| `@react-oauth/google`     | Google OAuth đăng nhập                                 |

---

## 5. CÁCH FRONTEND VÀ BACKEND KẾT NỐI

### 5.1. Kết nối HTTP REST API

Frontend giao tiếp với Backend thông qua **RESTful API** sử dụng cơ chế sau:

#### a) Base API Wrapper (`apiTongQuat.js`)
```
Frontend → fetch(`${VITE_BACKEND_URL}${endpoint}`, options) → Backend Express
```

- **Base URL:** Đọc từ `VITE_BACKEND_URL` (`.env`) = `http://localhost:8821`
- **Phương thức:** Sử dụng `fetch()` API native (KHÔNG dùng axios cho API chính)
- **Tự động phát hiện FormData** để switch Content-Type (JSON vs multipart)
- **Auto-logout:** Nếu response trả `401` → xóa token + redirect về `/`

#### b) Axios Instance (`axios-customize.js`)
- Dùng cho một số service riêng (baiGiangThuongMaiAPI.js)
- Cấu hình `withCredentials: true` để gửi cookie
- Response interceptor: Tự động unwrap `response.data`

### 5.2. Xác thực & Phân quyền

```
┌─────────┐   POST /api/auth/login    ┌─────────┐
│ Frontend │ ──────────────────────── │ Backend │
│          │  { taiKhoan, password }   │         │
│          │ ◄──────────────────────── │         │
│          │  { token, user, expiresAt}│         │
│          │                           │         │
│          │  GET /api/auth/me         │         │
│          │  Header: Bearer <token>   │         │
│          │ ──────────────────────── │         │
│          │ ◄──────────────────────── │         │
│          │  { user data }            │         │
└─────────┘                           └─────────┘
```

#### Luồng xác thực:
1. **Đăng nhập:** FE gửi `taiKhoan + password` → BE verify + trả JWT token
2. **Lưu token:** FE lưu vào `localStorage` (persist qua các tab)
3. **Mỗi request:** FE đính `Authorization: Bearer <token>` vào header
4. **BE verify:** Middleware `protect` decode JWT → tìm user trong DB → kiểm tra `currentToken` khớp
5. **Phân quyền:** Middleware `checkRole(['admin', 'giaovien'])` kiểm tra `req.user.role`
6. **Token expiry:** Admin: 24h, User thường: 12h. FE tự đặt timer để auto-logout
7. **Single session:** Mỗi user chỉ login được 1 thiết bị (token mới ghi đè token cũ trong DB)

### 5.3. Kết nối WebSocket (Socket.io)

```
┌─────────┐   WebSocket Connection    ┌─────────┐
│ Frontend │ ════════════════════════ │ Backend │
│ (Client) │   socket.io-client        │ (Server)│
│ Port 2004│                           │ Port 8821│
│          │   Events: reaction_post,  │         │
│          │   new_comment, etc.       │         │
└─────────┘                           └─────────┘
```

- **Backend:** HTTP Server được wrap bởi Socket.io Server (`new Server(server, { cors: {...} })`)
- **Frontend:** Custom hook `useSocket.js` sử dụng `socket.io-client`
- **Transport:** WebSocket + Polling fallback
- **Mục đích:** Cập nhật realtime (like, comment, thông báo)

### 5.4. Mã hóa dữ liệu

- **Backend → Frontend:** Một số response sử dụng **AES encryption** (CryptoJS)
- **Secret Key chung:** `VITE_SECRET_KEY` (FE) = `SECRET_KEY_CUA_BAN` (BE) = `"_0x7a21_KtQ_#99!_zZ_@2026"`
- **Frontend decrypt:** `cryptoHelper.js` sử dụng `CryptoJS.AES.decrypt()`

### 5.5. CORS Configuration

Backend cho phép các origin sau:
- `http://localhost:2004` (Frontend dev)
- `chrome-extension://gimjcdniohfjmmbhhdbcogfkfkbogfmn` (Chrome Extension)
- Socket.io: `http://localhost:2003`, `https://ktquizz.vercel.app`, `https://vuaquiz.com`

### 5.6. Upload File

```
Frontend (FormData) → POST /api/upload/image     → Backend (Multer) → public/uploads/images/
                    → POST /api/upload-video/video → Backend (Multer) → public/uploads/videos/
                    → POST /api/upload-audio/audio → Backend (Multer) → public/uploads/audios/
                    → POST /api/upload-document/document → Backend (Multer) → public/uploads/docs/
```

- Sử dụng `Multer` middleware cho file upload
- File được lưu vào thư mục `public/uploads/` trên server
- Frontend gửi qua `FormData` (KHÔNG set Content-Type, để browser tự xử lý boundary)

---

## 6. BẢO MẬT

### 6.1. Các biện pháp bảo mật đã triển khai:
- **Mật khẩu:** Hash bằng bcrypt (salt round: 10)
- **JWT Token:** Lưu `currentToken` trong DB → Single session enforcement
- **CORS:** Whitelist origin cụ thể
- **XSS Protection:** `xss-clean` middleware
- **HTTP Headers:** `helmet` middleware
- **Rate Limiting:** `express-rate-limit`
- **OTP Email:** Mã OTP 6 số, TTL 5 phút (auto-delete)
- **Input Validation:** `express-validator`
- **File Upload:** Giới hạn kích thước (10MB Word, 2MB JSON body)
- **Build Production:** Tắt sourcemap, drop console/debugger, obfuscate code (terser)
- **Chặn F12:** Component `ChanF12` chặn Dev Tools ở production
- **AES Encryption:** Mã hóa dữ liệu nhạy cảm giữa FE-BE

### 6.2. Hệ thống phân quyền (RBAC):

| Tính năng                  | Admin | Giáo viên | Học sinh |
|----------------------------|-------|-----------|----------|
| Quản lý tài khoản          | ✅    | ❌        | ❌       |
| Phân quyền                 | ✅    | ❌        | ❌       |
| Tạo/sửa/xóa lớp học       | ✅    | ✅ (lớp mình) | ❌   |
| Tạo/sửa/xóa bài giảng     | ✅    | ✅ (lớp mình) | ❌   |
| Import câu hỏi Word        | ✅    | ✅ (lớp mình) | ❌   |
| Phê duyệt học viên         | ✅    | ✅ (lớp mình) | ❌   |
| Xem lịch sử thi (hệ thống)| ✅    | ✅ (lớp mình) | ❌   |
| Xem thống kê               | ✅    | ✅ (lớp mình) | ❌   |
| Tham gia lớp (nhập mã)     | ❌    | ❌        | ✅       |
| Mua bài giảng              | ❌    | ❌        | ✅       |
| Làm bài thi                | ✅    | ✅        | ✅       |
| Xem lịch sử cá nhân       | ✅    | ✅        | ✅       |
| Bộ sưu tập                 | ✅    | ✅        | ✅       |

---

## 7. DEPLOYMENT & DEVOPS

### 7.1. Frontend Deployment
- **Platform:** Vercel
- **Config:** `vercel.json` (SPA fallback routes)
- **Build:** `vite build` → output `dist/`
- **Optimization:** Terser minification, no sourcemap, drop console

### 7.2. Backend Deployment
- **Platform:** VPS (Linux)
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **Domain:** `backend.chiconginverter.com` (từ config Nginx)
- **SSL:** Let's Encrypt (certbot)
- **RAM Monitoring:** Auto-warn khi RSS > 800MB

### 7.3. Database
- **Platform:** MongoDB Atlas (Cloud managed)
- **Cluster:** `webtaodethilamtracnghie.0vwqlck.mongodb.net`

---

## 8. TÍCH HỢP BÊN THỨ 3

| Service           | Mục đích                                                |
|-------------------|---------------------------------------------------------|
| **Gmail SMTP**    | Gửi email OTP đăng ký + khôi phục mật khẩu             |
| **Telegram Bot**  | Thông báo admin, phê duyệt bài viết từ Telegram        |
| **OpenAI (GPT)**  | Tích hợp AI hỗ trợ (tạo câu hỏi, phân tích)           |
| **MongoDB Atlas** | Database hosting cloud                                   |
| **Vercel**        | Frontend hosting + CI/CD                                 |
| **Google Maps**   | Hiển thị bản đồ (nếu cần)                               |
| **Google OAuth**  | Đăng nhập bằng Google (đã tích hợp thư viện)           |

---

## 9. TÓM TẮT KIẾN TRÚC

```
┌──────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE OVERVIEW                      │
│                                                                    │
│   [React SPA]  ←── REST API + WebSocket ──→  [Express.js API]    │
│   Vite 7           HTTP + Socket.io           Node.js             │
│   Port 2004                                    Port 8821          │
│   Ant Design                                   Mongoose           │
│   React Router v6                              JWT + bcrypt       │
│                                                Multer             │
│                         │                         │               │
│                         └────────┬────────────────┘               │
│                                  │                                 │
│                         [MongoDB Atlas]                            │
│                      WebsiteTest2026 DB                            │
│                      9+ Collections                                │
│                                                                    │
│   External Services:                                               │
│   ├─ Gmail SMTP (Nodemailer)                                      │
│   ├─ Telegram Bot (Telegraf)                                      │
│   ├─ OpenAI API (GPT)                                             │
│   ├─ Vercel (FE Deploy)                                           │
│   └─ VPS + PM2 + Nginx (BE Deploy)                                │
└──────────────────────────────────────────────────────────────────┘
```
