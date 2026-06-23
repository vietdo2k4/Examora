# CẤU TRÚC THƯ MỤC CHI TIẾT CỦA DỰ ÁN EXAMORA (VUAQUIZ)

Dự án Examora (trước đây là WebTaoDeThiLamTracNghiem) bao gồm 2 phần chính là Backend (Node.js/Express) và Frontend (React/Vite). Dưới đây là chi tiết cấu trúc thư mục của toàn bộ dự án.

---

## 1. TỔNG QUAN THƯ MỤC GỐC

```text
Examora/
├── TongQuanDuAn/                    # Thư mục chứa các tài liệu phân tích và mô tả dự án
│   ├── 01_TongQuan_KienTruc_DuAn.md # Tài liệu về kiến trúc tổng thể và cơ sở dữ liệu
│   ├── 02_ChucNang_API_ChiTiet.md   # Tài liệu mô tả chi tiết tất cả API
│   └── 03_CauTrucThuMuc_ChiTiet.md  # (Tài liệu này)
│
├── Backend/                         # Mã nguồn Backend (trước là BackendWebsiteLamBaiTestTracNghiem)
├── Frontend/                        # Mã nguồn Frontend (trước là GiaoDienWebsiteLamBaiTest2026)
└── Data WebTest/                    # Dữ liệu mẫu (nếu có)
```

---

## 2. CHI TIẾT MÃ NGUỒN BACKEND

Đường dẫn: `Examora/Backend/`

Đây là một API Server xây dựng bằng Node.js + Express.js.

```text
Backend/
├── src/                             # Chứa toàn bộ mã nguồn chính của Backend
│   ├── server.js                    # Entry point - Khởi tạo HTTP Server và kết nối Socket.io
│   ├── app.js                       # Cấu hình Express App - Middleware, CORS, và gắn Routes
│   │
│   ├── config/                      # Các file cấu hình hệ thống
│   │   ├── connectDB.js             # Kết nối với MongoDB Atlas
│   │   ├── viewEngine.js            # Cấu hình EJS View Engine (nếu dùng)
│   │   ├── uploadImage.js           # Multer config cho upload ảnh
│   │   ├── uploadVideo.js           # Multer config cho upload video
│   │   ├── uploadAudio.js           # Multer config cho upload audio
│   │   ├── uploadDocument.js        # Multer config cho upload tài liệu PDF/Docx
│   │   └── uploadFileWord.js        # Multer config chuyên biệt cho tính năng import câu hỏi
│   │
│   ├── models/                      # Định nghĩa các Schema của MongoDB (Mongoose)
│   │   ├── NguoiDung.js             # Bảng người dùng (Admin, Giáo viên, Học sinh)
│   │   ├── LopHoc.js                # Bảng lớp học
│   │   ├── BaiGiang.js              # Bảng bài giảng và chứa danh sách câu hỏi trắc nghiệm
│   │   ├── KetQuaBaiThi.js          # Kết quả sau khi học sinh nộp bài
│   │   ├── LichSuLamBai.js          # Snapshot đề thi (lưu lại đề gốc lúc thi)
│   │   ├── BaiGiangDaMua.js         # Lưu giao dịch mua bài giảng
│   │   ├── MonHoc.js                # Bảng môn học
│   │   └── OtpStorage.js            # Lưu trữ mã OTP tạm thời (TTL 5 phút)
│   │
│   ├── controllers/                 # Logic xử lý cho từng Endpoint API
│   │   ├── auth/                    # Xử lý Đăng ký, Đăng nhập, OTP, Quên mật khẩu
│   │   ├── baigiang/                # Logic xử lý liên quan đến bài giảng, bài thi
│   │   ├── lophoc/                  # Logic xử lý tạo/sửa lớp học, phê duyệt học viên
│   │   ├── nguoidung/               # Quản lý profile người dùng cá nhân
│   │   ├── admin/                   # Logic dành riêng cho role Admin (quản lý user)
│   │   └── uploads/                 # Logic xử lý upload file
│   │
│   ├── middlewares/                 # Các hàm trung gian chặn trước khi vào Controller
│   │   ├── authMiddleware.js        # Kiểm tra tính hợp lệ của JWT token
│   │   ├── authMiddlewareFull.js    # Kiểm tra phân quyền (Roles: admin, giaovien, hocsinh)
│   │   └── adminMiddleware.js       # Kiểm tra quyền tối cao của Admin
│   │
│   ├── routes/                      # Định nghĩa các Endpoint (đường dẫn API)
│   │   ├── authRouter.js            # Các route /api/auth/*
│   │   ├── baiGiangRoutes.js        # Các route /api/bai-giang/*
│   │   ├── baiGiangThuongMaiRoutes.js# Các route /api/bai-giang-thuong-mai/*
│   │   ├── lopHocRoutes.js          # Các route /api/lop-hoc/*
│   │   ├── lichSuThiRoutes.js       # Các route /api/lich-su-thi/*
│   │   ├── nguoiDungRoutes.js       # Các route /api/nguoidung/*
│   │   ├── quanLyNguoiDungRoutes.js # Các route /api/admin/nguoi-dung/*
│   │   └── upload*Route.js          # Các route upload ảnh, video, docs
│   │
│   ├── services/                    # Tích hợp dịch vụ bên thứ 3
│   │   ├── telegramService.js       # Gọi API gửi tin nhắn Telegram Bot
│   │   ├── deThiTelegramService.js  # Tích hợp bot trả đề thi qua Telegram
│   │   └── botConfig.js             # Cấu hình Token của Bot
│   │
│   └── utils/                       # Các hàm dùng chung (Helper functions)
│       ├── generateToken.js         # Hàm tạo JWT token
│       └── randomCode.js            # Sinh mã lớp học (6 ký tự ngẫu nhiên)
│
├── public/                          # Thư mục public chứa tài sản server
│   └── uploads/                     # Nơi Multer lưu trữ các file upload từ user
│       ├── images/
│       ├── videos/
│       ├── audios/
│       └── docs/
│
├── .env                             # File chứa các biến môi trường (Database URI, JWT Secret)
├── package.json                     # Danh sách các thư viện Node.js được dùng
└── README.md
```

---

## 3. CHI TIẾT MÃ NGUỒN FRONTEND

Đường dẫn: `Examora/Frontend/`

Đây là một SPA (Single Page Application) sử dụng React 18, Vite và Ant Design.

```text
Frontend/
├── src/                             # Chứa toàn bộ mã nguồn của giao diện
│   ├── main.jsx                     # Entry point - Render React vào DOM
│   ├── App.jsx                      # Root component - Nơi bọc Router và Provider
│   ├── router.jsx                   # Định nghĩa tất cả các đường dẫn (React Router v6)
│   ├── layout.css                   # File CSS tổng quan cho bố cục
│   │
│   ├── pages/                       # Chứa các màn hình (trang) của ứng dụng
│   │   ├── Login/                   # Màn hình đăng nhập, đăng ký
│   │   ├── Home/                    # Trang chủ (Dashboard)
│   │   ├── Admin/                   # Các trang dành cho Admin và Giáo viên
│   │   │   ├── Classes/             # Quản lý lớp học
│   │   │   ├── QuanLyTaiKhoan/      # Quản lý user (Chỉ Admin)
│   │   │   └── LichSuThi/           # Xem lịch sử hệ thống
│   │   │
│   │   ├── HocSinh/                 # Các trang dành cho Học sinh
│   │   │   ├── BoSuuTap/            # Danh sách bài giảng đã mua
│   │   │   └── LamBai/              # Giao diện thi trắc nghiệm online
│   │   │
│   │   └── PageAdmin/               # Trang báo lỗi
│   │       └── ForbiddenPage/       # Trang lỗi 403 (Không có quyền)
│   │
│   ├── components/                  # Chứa các component dùng chung (Tái sử dụng)
│   │   ├── layout/
│   │   │   └── DashboardLayout/     # Bố cục chính bao gồm Header, Sidebar và Content
│   │   ├── ProtectedRoute/          # Component bọc ngoài để chặn user chưa đăng nhập
│   │   ├── HeaderApp/               # Header trên cùng của app
│   │   ├── FooterApp/               # Footer của app
│   │   ├── AuthModal/               # Pop-up đăng nhập/đăng ký
│   │   └── ThemeSwitcher/           # Nút gạt chuyển đổi giao diện Sáng / Tối
│   │
│   ├── contexts/                    # Quản lý State toàn cục (React Context)
│   │   ├── AuthContext.jsx          # Lưu trữ thông tin User, Token và trạng thái Đăng nhập
│   │   └── FavoritesContext.jsx     # Lưu trữ danh sách yêu thích
│   │
│   ├── services/                    # Tầng giao tiếp với Backend (Call API)
│   │   ├── apiTongQuat.js           # Base file config fetch API cơ bản
│   │   ├── apiAuth.js               # Các hàm API gọi đến /api/auth
│   │   ├── apiBaiGiang.js           # Các hàm API gọi đến /api/bai-giang
│   │   ├── apiLopHoc.js             # Các hàm API gọi đến /api/lop-hoc
│   │   ├── apiLichSuThi.js          # Các hàm API gọi đến /api/lich-su-thi
│   │   ├── apiQuanLyNguoiDung.js    # Các hàm API gọi đến /api/admin/nguoi-dung
│   │   ├── baiGiangThuongMaiAPI.js  # Các hàm API liên quan đến mua bán, làm bài
│   │   └── uploadAPI.js             # Các hàm API xử lý upload
│   │
│   ├── hook/                        # Custom React Hooks
│   │   └── useSocket.js             # Hook giúp component dễ dàng kết nối tới Socket.io
│   │
│   ├── config/                      # Các cấu hình tĩnh của Frontend
│   │   └── rolePermissions.js       # Phân định quyền nào được vào màn hình nào
│   │
│   ├── utils/                       # Các hàm tiện ích dùng chung
│   │   ├── auth.js                  # Lấy/Lưu Token từ LocalStorage
│   │   ├── axios-customize.js       # Cấu hình Interceptor của Axios (tự động gắn token)
│   │   ├── cryptoHelper.js          # Hàm giải mã dữ liệu mã hóa từ Backend (AES)
│   │   ├── formatContent.js         # Định dạng Text/HTML
│   │   └── scrollUtils.js           # Cuộn trang tự động
│   │
│   └── assets/                      # Hình ảnh, Fonts, Icons cục bộ
│
├── public/                          # Thư mục public của Vite (chứa favicon, static assets)
├── dist/                            # Thư mục output sau khi chạy lệnh build
├── index.html                       # Khung HTML gốc để React mount vào
├── vite.config.js                   # Cấu hình trình biên dịch Vite
├── vercel.json                      # Cấu hình routing khi Deploy lên Vercel
├── package.json                     # Danh sách thư viện UI (Antd, React, Axios,...)
└── .env                             # Cấu hình biến môi trường Frontend (VITE_BACKEND_URL)
```
