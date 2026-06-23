# PHÂN TÍCH CHI TIẾT CHỨC NĂNG VÀ API CỦA DỰ ÁN

## 📌 Website Tạo Đề Thi & Làm Bài Trắc Nghiệm (VuaQuiz / Examora)

> **Ngày cập nhật:** 22/06/2026 (Đã cập nhật cấu trúc: Thư mục dự án đổi thành `Examora`, `GiaoDienWebsiteLamBaiTest2026` đổi thành `Frontend`, `BackendWebsiteLamBaiTestTracNghiem` đổi thành `Backend`)
> **Phiên bản:** 1.0

---

## MỤC LỤC CHỨC NĂNG

1. [Xác thực & Tài khoản (Auth)](#1-xác-thực--tài-khoản-auth)
2. [Quản lý Lớp học (LopHoc)](#2-quản-lý-lớp-học-lophoc)
3. [Quản lý Bài giảng (BaiGiang)](#3-quản-lý-bài-giảng-baigiang)
4. [Quản lý Câu hỏi trắc nghiệm](#4-quản-lý-câu-hỏi-trắc-nghiệm)
5. [Hệ thống Thương mại - Mua & Làm bài thi](#5-hệ-thống-thương-mại---mua--làm-bài-thi)
6. [Lịch sử thi & Thống kê (Admin/GV)](#6-lịch-sử-thi--thống-kê-admingv)
7. [Quản lý Người dùng (Admin)](#7-quản-lý-người-dùng-admin)
8. [Upload File (Ảnh, Video, Audio, Tài liệu)](#8-upload-file)
9. [Tích hợp Telegram Bot](#9-tích-hợp-telegram-bot)
10. [Hệ thống Frontend - Giao diện & Routing](#10-hệ-thống-frontend---giao-diện--routing)

---

## 1. XÁC THỰC & TÀI KHOẢN (Auth)

### Tổng quan
Module xác thực xử lý toàn bộ luồng đăng ký (2 bước OTP), đăng nhập, đăng xuất, quản lý thông tin cá nhân, đổi mật khẩu và quên mật khẩu. Sử dụng JWT (JSON Web Token) cho phiên đăng nhập.

### Thư viện / Tool sử dụng:
- `bcryptjs` - Hash mật khẩu (salt round: 10)
- `jsonwebtoken` - Tạo/verify JWT token
- `nodemailer` - Gửi email OTP qua Gmail SMTP
- `crypto` - Sinh mật khẩu ngẫu nhiên (quên mật khẩu)
- `jwt-decode` (Frontend) - Decode JWT để lấy thời gian hết hạn

---

### 1.1. Đăng ký tài khoản (Bước 1 - Gửi OTP)

**API:** `POST /api/auth/register`

**Quyền truy cập:** Public (không cần đăng nhập)

**Request Body:**
```json
{
  "email": "user@example.com",
  "mat_khau": "password123",
  "ho_ten": "Nguyễn Văn A",
  "so_dien_thoai": "0901234567",
  "ma_so": "SV001"
}
```

**Luồng hoạt động:**
1. Validate input (email, mat_khau bắt buộc)
2. Kiểm tra email đã tồn tại VÀ đã kích hoạt (`isActive: true`) → Nếu đã active thì chặn
3. Nếu email tồn tại nhưng `isActive: false` → Cho phép gửi lại OTP (đăng ký lại)
4. Kiểm tra trùng số điện thoại (tương tự logic email)
5. Kiểm tra trùng mã sinh viên (tương tự)
6. Tạo mã OTP 6 số ngẫu nhiên: `Math.floor(100000 + Math.random() * 900000)`
7. Lưu OTP vào collection `OtpStorage` (upsert: cập nhật nếu đã có)
8. Gửi email chứa OTP qua `nodemailer` (Gmail SMTP) với template HTML đẹp
9. OTP tự động hết hạn sau 5 phút (TTL index MongoDB: `expires: 300`)

**Response thành công:**
```json
{
  "success": true,
  "message": "Thông tin hợp lệ. Mã OTP đã được gửi về email!"
}
```

---

### 1.2. Xác thực OTP & Hoàn tất đăng ký (Bước 2)

**API:** `POST /api/auth/verify-register`

**Quyền truy cập:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "ho_ten": "Nguyễn Văn A",
  "so_dien_thoai": "0901234567",
  "mat_khau": "password123",
  "ma_so": "SV001"
}
```

**Luồng hoạt động:**
1. Tìm record OTP trong `OtpStorage` khớp email + otp
2. Nếu không tìm thấy → OTP sai hoặc hết hạn
3. Hash mật khẩu bằng `bcrypt.hash(mat_khau, 10)`
4. **Xử lý Duplicate Key:**
   - Nếu user đã tồn tại (isActive: false) → Cập nhật thông tin + set `isActive: true`
   - Nếu user hoàn toàn mới → Tạo mới với `isActive: true`
5. Xóa OTP khỏi `OtpStorage`
6. Tạo JWT token bằng `generateToken(user)`
7. Trả về token + thông tin user

**Response thành công:**
```json
{
  "message": "Xác thực và Đăng ký thành công",
  "user": { "id": "...", "email": "...", "ho_ten": "...", "role": "hocsinh" },
  "token": "eyJhbGciOiJIUzI1NiI..."
}
```

---

### 1.3. Đăng nhập

**API:** `POST /api/auth/login`

**Quyền truy cập:** Public

**Request Body:**
```json
{
  "taiKhoan": "user@example.com",  // Có thể là email, SĐT, hoặc mã số
  "password": "password123"
}
```

**Luồng hoạt động:**
1. Validate: Cả `taiKhoan` và `password` phải có
2. Tìm user theo 3 trường: `email` HOẶC `so_dien_thoai` HOẶC `ma_so` (dùng `$or` query)
3. Kiểm tra user tồn tại
4. Kiểm tra `isActive` - Tài khoản có bị khóa không
5. So sánh mật khẩu: `bcrypt.compare(password, user.mat_khau)`
6. Tạo JWT token:
   - Admin: expiresIn = 24 giờ
   - User thường: expiresIn = 12 giờ
7. **Single Session:** Lưu `currentToken` vào DB → Chỉ cho phép 1 thiết bị login cùng lúc
8. Trả về: token, expiresAt (timestamp), user info

**Response thành công:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "...", "ma_so": "...", "email": "...", "so_dien_thoai": "...",
    "ho_ten": "...", "role": "hocsinh", "anh_dai_dien": "...",
    "ten_lop_sinh_hoat": "...", "soDu": 0
  },
  "token": "eyJhbGciOiJIUzI1NiI...",
  "expiresAt": 1750636800000
}
```

**Frontend xử lý sau đăng nhập:**
1. Lưu token vào `localStorage`
2. Set user + token vào AuthContext
3. Dispatch event `user_logged_in` và `cart_updated`
4. Đặt timer auto-logout khi token hết hạn (`setTimeout`)
5. Lắng nghe `storage` event để đồng bộ logout/login giữa các tab

---

### 1.4. Đăng xuất

**API:** `POST /api/auth/logout`

**Quyền truy cập:** Authenticated (có token)

**Headers:** `Authorization: Bearer <token>`

**Luồng hoạt động:**
1. Extract token từ header
2. Decode token để lấy user ID
3. Xóa `currentToken` trong DB: `$unset: { currentToken: "" }`
4. Frontend: Xóa token khỏi `localStorage` + `sessionStorage`

---

### 1.5. Lấy thông tin user hiện tại

**API:** `GET /api/auth/me`

**Middleware:** `protect` (xác thực JWT)

**Luồng hoạt động:**
1. Middleware `protect` decode JWT → tìm user → kiểm tra `currentToken` khớp
2. Trả về user info (loại bỏ `mat_khau` và `currentToken`)

---

### 1.6. Đổi mật khẩu

**API:** `PUT /api/auth/doi-mat-khau`

**Middleware:** `protect`

**Request Body:**
```json
{
  "matKhauCu": "old_password",
  "matKhauMoi": "new_password"
}
```

**Luồng hoạt động:**
1. Verify mật khẩu cũ bằng `bcrypt.compare()`
2. Hash mật khẩu mới bằng `bcrypt.hash()` (salt: 10)
3. Cập nhật `user.mat_khau` và lưu

---

### 1.7. Cập nhật thông tin cá nhân

**API:** `PUT /api/auth/cap-nhat-thong-tin`

**Middleware:** `protect`

**Request Body:**
```json
{
  "ho_ten": "Tên mới",
  "so_dien_thoai": "0901234567",
  "anh_dai_dien": "/uploads/images/avatar.jpg",
  "ten_lop_sinh_hoat": "IT01",
  "gioiThieu": "Giới thiệu bản thân"
}
```

**Luồng hoạt động:**
1. Tìm user từ `req.user._id`
2. Cập nhật từng trường (check `!== undefined`)
3. Không cho phép sửa: email, role, ma_so, mat_khau

---

### 1.8. Quên mật khẩu

**API:** `POST /api/auth/forgot-password`

**Quyền truy cập:** Public

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Luồng hoạt động:**
1. Tìm user theo email
2. Kiểm tra `isActive` - Tài khoản bị khóa thì không cho reset
3. Tạo mật khẩu ngẫu nhiên 8 ký tự: `crypto.randomBytes(4).toString("hex")`
4. Hash mật khẩu mới và lưu vào DB
5. Gửi email chứa mật khẩu mới (template HTML)
6. Người dùng login bằng mật khẩu mới → Tự đổi lại mật khẩu

---

## 2. QUẢN LÝ LỚP HỌC (LopHoc)

### Tổng quan
Module quản lý lớp học cho phép giáo viên tạo lớp, quản lý học viên, phê duyệt yêu cầu tham gia. Học sinh có thể nhập mã lớp để xin vào.

### Thư viện / Tool sử dụng:
- `crypto` - Tự động sinh mã lớp ngẫu nhiên (hex)
- `randomCode.js` (custom util) - Sinh mã lớp không trùng

---

### 2.1. Tạo lớp học mới

**API:** `POST /api/lop-hoc`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Request Body:**
```json
{
  "ten_lop": "Lập trình Web - K62",
  "anh_lop": "/uploads/images/class.jpg",
  "mo_ta_lop": "Lớp lập trình web nâng cao",
  "si_so_toi_da": 50,
  "ngay_bat_dau": "2026-01-15"
}
```

**Luồng hoạt động:**
1. Sinh mã lớp ngẫu nhiên duy nhất: `generateClassCode()`
2. Tự động gán `id_giaovien = req.user.id` (giáo viên tạo lớp)
3. Tạo `maKey` tự động (6 ký tự hex)
4. Lưu vào DB

---

### 2.2. Lấy danh sách lớp học

**API:** `GET /api/lop-hoc`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Nếu là `giaovien` → Chỉ trả lớp của giáo viên đó
2. Nếu là `admin` → Trả tất cả
3. Nếu là `hocsinh` → Trả tất cả nhưng **ẩn `ma_lop_random`** (bảo mật)
4. Populate: `id_giaovien` (ho_ten, email, anh_dai_dien), `danh_sach_hoc_vien.id_hoc_vien`

---

### 2.3. Lấy chi tiết lớp học

**API:** `GET /api/lop-hoc/:id`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Tìm lớp theo ID
2. **Ẩn `ma_lop_random`** trong response (bảo mật)
3. Populate: `id_giaovien`, `danh_sach_hoc_vien.id_hoc_vien`

---

### 2.4. Cập nhật lớp học

**API:** `PUT /api/lop-hoc/:id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Kiểm tra quyền: chỉ giáo viên tạo lớp mới được sửa
2. Update với `$set: req.body`

---

### 2.5. Xóa lớp học

**API:** `DELETE /api/lop-hoc/:id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Kiểm tra quyền sở hữu lớp
2. `findOneAndDelete`

---

### 2.6. Đổi mã lớp (Refresh Code)

**API:** `PUT /api/lop-hoc/:id/refresh-code`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Kiểm tra quyền sở hữu
2. Sinh mã mới: `generateClassCode()` (kiểm tra trùng trong DB)
3. Cập nhật `ma_lop_random` mới

**Response:**
```json
{
  "success": true,
  "message": "Đã làm mới mã lớp thành công",
  "ma_lop_random": "ABC123"
}
```

---

### 2.7. Học sinh xin vào lớp (nhập mã)

**API:** `POST /api/lop-hoc/join-by-code`

**Middleware:** `protect` → `checkRole(['hocsinh'])`

**Request Body:**
```json
{
  "ma_lop_random": "ABC123"
}
```

**Luồng hoạt động:**
1. Tìm lớp theo `ma_lop_random`
2. Kiểm tra: Đã gửi yêu cầu / đã ở trong lớp → Chặn
3. Kiểm tra sĩ số: `danh_sach_hoc_vien.length >= si_so_toi_da` → Chặn
4. Push vào `danh_sach_hoc_vien` với `trang_thai_phe_duyet: 'cho_phe_duyet'`
5. Chờ giáo viên phê duyệt

---

### 2.8. Phê duyệt/Từ chối học viên

**API:** `PUT /api/lop-hoc/approve-student`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Request Body:**
```json
{
  "classId": "60a7b2c...",
  "studentId": "60a7b3d...",
  "status": "da_tham_gia"  // hoặc "bi_tu_choi"
}
```

**Luồng hoạt động:**
1. Kiểm tra lớp thuộc quyền quản lý của giáo viên
2. Tìm học viên trong `danh_sach_hoc_vien`
3. Cập nhật `trang_thai_phe_duyet` = `da_tham_gia` hoặc `bi_tu_choi`

---

## 3. QUẢN LÝ BÀI GIẢNG (BaiGiang)

### Tổng quan
Module bài giảng cho phép tạo, sửa, xóa bài giảng kèm nội dung soạn thảo (HTML) và danh sách câu hỏi trắc nghiệm. Mỗi bài giảng thuộc về một lớp học.

### Thư viện / Tool sử dụng:
- `mammoth` - Đọc file Word (.docx) và chuyển thành HTML/text
- `cheerio` - Parse HTML để phát hiện đáp án in đậm (bold) trong file Word
- `multer` - Upload file Word (memoryStorage, giới hạn 10MB, chỉ .docx)
- `crypto` - Tự động sinh mã bài giảng (6 ký tự hex)

---

### 3.1. Tạo bài giảng mới

**API:** `POST /api/bai-giang`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Request Body:**
```json
{
  "id_lop_hoc": "60a7b2c...",
  "ten_bai_giang": "Kiểm tra giữa kỳ - Chương 1-3",
  "anhDaiDien": "/uploads/images/bg.jpg",
  "gioiThieu": "Bài kiểm tra 30 câu, thời gian 45 phút",
  "noi_dung_bai_hoc": "<h1>Chương 1: Giới thiệu</h1>...",
  "danhSachCauHoi": [...],
  "thoi_gian_lam_bai": 45,
  "giaBaiGiang": 0
}
```

**Luồng hoạt động:**
1. Kiểm tra lớp học tồn tại
2. Kiểm tra quyền: giáo viên của lớp hoặc admin
3. Tạo bài giảng với `maBaiGiang` tự động (hex)
4. Populate `id_lop_hoc` và trả về

---

### 3.2. Lấy danh sách bài giảng

**API:** `GET /api/bai-giang?page=1&limit=10&search=kiểm tra&sortBy=ngay_tao&order=desc`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Xây dựng filter: search (regex tên), id_lop_hoc
2. Nếu `giaovien` → Chỉ hiện bài giảng của lớp mình quản lý
3. Sử dụng **Aggregation Pipeline** với `$facet` cho phân trang hiệu quả
4. `$lookup` để join với `lopHocs` và `monhocs`
5. Trả về: baiGiangs, totalPages, totalBaiGiang, currentPage

---

### 3.3. Lấy chi tiết bài giảng

**API:** `GET /api/bai-giang/:id`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Tìm bài giảng + populate lớp học
2. **Kiểm tra quyền xem:** Admin, giáo viên quản lý lớp, hoặc học viên đã được duyệt
3. **BẢO MẬT QUAN TRỌNG:** Nếu là `hocsinh` → **Ẩn `laDapAnDung`** (đáp án đúng) trong danh sách câu hỏi
4. Giáo viên/Admin xem được đầy đủ đáp án

---

### 3.4. Cập nhật bài giảng

**API:** `PUT /api/bai-giang/:id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Kiểm tra quyền sở hữu
2. **Không cho sửa:** `maBaiGiang`, `id_lop_hoc`, `ngay_tao`
3. Update với `$set` + `runValidators: true`

---

### 3.5. Xóa bài giảng

**API:** `DELETE /api/bai-giang/:id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

---

### 3.6. Lấy bài giảng theo lớp học

**API:** `GET /api/bai-giang/lop-hoc/:id_lop_hoc?page=1&limit=10`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Hỗ trợ tìm lớp theo cả ObjectId và `maKey`
2. Kiểm tra quyền: giáo viên quản lý lớp hoặc học viên đã được duyệt
3. Trả danh sách bài giảng (KHÔNG trả câu hỏi, chỉ trả `soCauHoi`)

---

### 3.7. Thống kê bài giảng (Dashboard)

**API:** `GET /api/bai-giang/thong-ke/tong-quan`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Response:**
```json
{
  "success": true,
  "data": {
    "tongSoBaiGiang": 15,
    "tongSoCauHoi": 450,
    "baiGiangCoCauHoi": 12,
    "baiGiangKhongCauHoi": 3
  }
}
```

---

## 4. QUẢN LÝ CÂU HỎI TRẮC NGHIỆM

### 4.1. Thêm một câu hỏi

**API:** `POST /api/bai-giang/:id/cau-hoi`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Request Body:**
```json
{
  "noiDungCauHoi": "React là gì?",
  "cacDapAn": [
    { "noiDungDapAn": "Thư viện JavaScript", "laDapAnDung": true },
    { "noiDungDapAn": "Ngôn ngữ lập trình", "laDapAnDung": false },
    { "noiDungDapAn": "Hệ điều hành", "laDapAnDung": false },
    { "noiDungDapAn": "Database", "laDapAnDung": false }
  ],
  "giaiThich": "React là thư viện JavaScript do Facebook phát triển"
}
```

**Validation:**
- Phải có nội dung câu hỏi
- Ít nhất 2 đáp án
- Ít nhất 1 đáp án đúng
- Hỗ trợ chọn nhiều đáp án đúng

---

### 4.2. Thêm nhiều câu hỏi cùng lúc

**API:** `POST /api/bai-giang/:id/cau-hoi/nhieu`

**Request Body:**
```json
{
  "cauHois": [
    { "noiDungCauHoi": "...", "cacDapAn": [...], "giaiThich": "..." },
    { "noiDungCauHoi": "...", "cacDapAn": [...], "giaiThich": "..." }
  ]
}
```

**Luồng hoạt động:**
1. Validate từng câu hỏi trong mảng
2. Push tất cả vào `danhSachCauHoi` cùng lúc
3. Trả về số lượng đã thêm

---

### 4.3. Cập nhật câu hỏi

**API:** `PUT /api/bai-giang/:id/cau-hoi/:cauHoiId`

---

### 4.4. Xóa câu hỏi

**API:** `DELETE /api/bai-giang/:id/cau-hoi/:cauHoiId`

---

### 4.5. Sắp xếp lại thứ tự câu hỏi

**API:** `PUT /api/bai-giang/:id/cau-hoi/sap-xep`

**Request Body:**
```json
{
  "cauHoiIds": ["id_cau_1", "id_cau_3", "id_cau_2", ...]
}
```

**Luồng hoạt động:**
1. Validate: Số lượng ID phải khớp với số câu hỏi hiện tại
2. Tạo Map câu hỏi theo ID
3. Sắp xếp lại theo thứ tự mới
4. Lưu vào DB

---

### 4.6. Import câu hỏi từ file Word (.docx)

**API:** `POST /api/bai-giang/:id/cau-hoi/import-word`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])` → `multer.single('file')`

**Request:** FormData với file `.docx`

**Thư viện sử dụng:**
- `mammoth` - Chuyển .docx → HTML và raw text
- `cheerio` - Parse HTML để phát hiện thẻ `<strong>` (bold = đáp án đúng)
- `multer` - Nhận file upload (lưu tạm vào `public/uploads/docs/`)

**Phân tích chi tiết luồng hoạt động:**
1. **Quá trình Upload:** Giao diện gọi API với `FormData` chứa file `.docx`. File được `multer` tiếp nhận và lưu tạm vào thư mục `public/uploads/docs/` trên server.
2. **Đọc nội dung Word:**
   - Đọc file từ ổ cứng lên bộ nhớ (buffer).
   - Dùng `mammoth.extractRawText({ buffer })` để lấy văn bản thô (phục vụ lấy nội dung chữ).
   - Dùng `mammoth.convertToHtml({ buffer })` để chuyển định dạng Word sang HTML. Điều này cực kỳ quan trọng vì nó giúp giữ lại định dạng in đậm (thẻ `<strong>` hoặc `<b>`) - tín hiệu để xác định đáp án đúng.
3. **Thuật toán phân tích (`parseQuestionsFromHtml`):**
   - Dùng `cheerio` lặp qua từng thẻ `<p>` (paragraph) của chuỗi HTML.
   - Nếu thẻ `<p>` có chứa thẻ `<strong>` hoặc `<b>`, hệ thống đánh dấu đó là đáp án đúng (`isCorrect: true`).
   - Nhóm các dòng theo quy tắc: Cứ 5 đoạn văn liên tiếp = 1 câu hỏi (1 dòng câu hỏi + 4 dòng đáp án). Thuật toán tự động cắt bỏ các tiền tố (ví dụ: "A. ", "B. ") của đáp án.
   - Dòng giải thích (nếu có): Kiểm tra dòng thứ 6, nếu dòng này bắt đầu bằng các từ khóa như *Note, Giải thích, Lưu ý, Lời giải...* thì sẽ được gán làm lời giải thích cho câu hỏi.
4. **Lưu Database & Dọn dẹp:**
   - Các câu hỏi sau khi parse được `push` thẳng vào mảng `danhSachCauHoi` của bài giảng đó và lưu vào DB.
   - Cuối cùng, gọi `fs.unlinkSync()` để xóa file Word tạm khỏi server nhằm giải phóng dung lượng.

**Quy tắc format file Word chuẩn:**
- Mỗi câu hỏi cách nhau bởi dòng trống.
- Thứ tự bắt buộc: 1 dòng câu hỏi -> 4 dòng đáp án (mỗi đáp án 1 dòng, bắt đầu bằng A., B., C., D.).
- **Đáp án đúng bắt buộc phải được bôi đậm (Bold)** (Ví dụ: **A. Thư viện JavaScript**).
- Dòng giải thích (tùy chọn) phải nằm ngay dưới đáp án cuối cùng và bắt đầu bằng "Giải thích:" hoặc "Note:".

---

## 5. HỆ THỐNG THƯƠNG MẠI - MUA & LÀM BÀI THI

### Tổng quan
Module cho phép học sinh "mua" bài giảng (trừ số dư tài khoản), sau đó làm bài thi trắc nghiệm. Hệ thống chấm điểm tự động, lưu kết quả, cho phép thi lại nhiều lần, và xem đáp án chi tiết.

---

### 5.1. Mua bài giảng

**API:** `POST /api/bai-giang-thuong-mai/mua-bai-giang`

**Middleware:** `protect` (authMiddleware)

**Request Body:**
```json
{
  "id_bai_giang": "60a7b2c..."
}
```

**Luồng hoạt động:**
1. Kiểm tra bài giảng tồn tại
2. Kiểm tra đã mua chưa (unique index: `id_hoc_sinh + id_bai_giang`)
3. Kiểm tra số dư: `hocSinh.soDu >= baiGiang.giaBaiGiang`
4. Trừ tiền: `$inc: { soDu: -giaBaiGiang }`
5. Tạo record `BaiGiangDaMua` với `trang_thai: 'da_mua'`
6. Trả về số dư còn lại

---

### 5.2. Lấy danh sách bài giảng đã mua

**API:** `GET /api/bai-giang-thuong-mai/danh-sach-da-mua?page=1&limit=10&search=`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Query theo `id_hoc_sinh` (từ token)
2. Populate: `id_bai_giang` (tên, ảnh, giá, thời gian, số câu hỏi, tên lớp)
3. Hỗ trợ phân trang và tìm kiếm theo tên bài giảng/tên lớp

---

### 5.3. Lấy bài thi (không có đáp án)

**API:** `GET /api/bai-giang-thuong-mai/bai-thi/:id_bai_giang`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Kiểm tra đã mua chưa → Nếu chưa mua → 403
2. Lấy bài giảng + danh sách câu hỏi
3. Đếm số lần thi đã thực hiện
4. Lấy điểm cao nhất
5. **BẢO MẬT:** Trả câu hỏi + đáp án NHƯNG **KHÔNG** trả `laDapAnDung`
6. Label đáp án: A, B, C, D (`String.fromCharCode(65 + idx)`)

**Response:**
```json
{
  "success": true,
  "data": {
    "baiGiang": { "_id": "...", "ten_bai_giang": "...", "thoi_gian_lam_bai": 30 },
    "cauHoi": [
      {
        "id": "...", "stt": 1, "noiDungCauHoi": "React là gì?",
        "cacDapAn": [
          { "label": "A", "noiDung": "Thư viện JavaScript" },
          { "label": "B", "noiDung": "Ngôn ngữ lập trình" }
        ]
      }
    ],
    "tongSoCau": 30,
    "soLanThi": 2,
    "diemCaoNhat": 8.5
  }
}
```

---

### 5.4. Nộp bài thi

**API:** `POST /api/bai-giang-thuong-mai/nop-bai-thi`

**Middleware:** `protect`

**Request Body:**
```json
{
  "id_bai_giang": "60a7b2c...",
  "dapAnDaChon": ["A", "C", "B", null, "D", ...],
  "thoi_gian_lam_bai": 1500
}
```

**Luồng hoạt động:**
1. Kiểm tra đã mua chưa
2. Lấy bài giảng + đáp án đúng
3. Đếm số lần thi trước đó + 1
4. **Chấm điểm tự động:**
   - Duyệt từng câu hỏi
   - Tìm đáp án đúng (index có `laDapAnDung: true`) → Convert sang label (A/B/C/D)
   - So sánh với đáp án học sinh đã chọn
   - Đếm số câu đúng
   - Tính điểm: `(soCauDung / tongSoCau * 10).toFixed(2)`
5. Lưu vào `KetQuaBaiThi`: chi tiết từng câu (đáp án chọn, đáp án đúng, đúng/sai)
6. Cập nhật trạng thái `BaiGiangDaMua`:
   - Điểm >= 8 → `da_hoan_thanh`
   - Điểm < 8 → `dang_hoc`

**Response:**
```json
{
  "success": true,
  "message": "Nộp bài thành công",
  "data": {
    "lanThi": 3,
    "soCauDung": 25,
    "tongSoCau": 30,
    "diem": 8.33,
    "chiTiet": [
      { "id_cau_hoi": "...", "dap_an_chon": "A", "dap_an_dung": "A", "dung_sai": true },
      { "id_cau_hoi": "...", "dap_an_chon": "C", "dap_an_dung": "B", "dung_sai": false }
    ]
  }
}
```

---

### 5.5. Xem đáp án chi tiết

**API:** `GET /api/bai-giang-thuong-mai/xem-dap-an/:id_bai_giang?lan_thi=2`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Lấy kết quả thi (mới nhất nếu không chỉ định lần thi)
2. Join với bài giảng để lấy câu hỏi + giải thích
3. Trả về chi tiết: câu hỏi, đáp án đã chọn, đáp án đúng, giải thích
4. Cập nhật `trang_thai: 'da_xem_dap_an'`

---

### 5.6. Lịch sử thi (Học sinh)

**API:** `GET /api/bai-giang-thuong-mai/lich-su-thi?page=1&limit=10&search=`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Query `KetQuaBaiThi` theo `id_hoc_sinh`
2. Populate tên bài giảng, ảnh đại diện
3. Hỗ trợ phân trang và tìm kiếm

---

### 5.7. Tiến độ học tập

**API:** `GET /api/bai-giang-thuong-mai/tien-do-hoc-tap`

**Middleware:** `protect`

**Response:**
```json
{
  "success": true,
  "data": {
    "tongBaiDaMua": 10,
    "baiDaHoanThanh": 7,
    "baiDangHoc": 3,
    "soLanThi": 25,
    "diemTrungBinh": 7.8,
    "phanTramHoanThanh": 70
  }
}
```

---

### 5.8. Thống kê theo lớp (Giáo viên)

**API:** `GET /api/bai-giang-thuong-mai/thong-ke/lop/:id_lop_hoc`

**Middleware:** `protect`

**Luồng hoạt động:**
1. Kiểm tra lớp thuộc giáo viên
2. Lấy danh sách học sinh đã mua bài giảng trong lớp
3. Thống kê từng học sinh: số bài đã thi, điểm trung bình, điểm cao nhất
4. Sắp xếp theo điểm giảm dần

---

### 5.9. Thống kê theo học sinh (Giáo viên)

**API:** `GET /api/bai-giang-thuong-mai/thong-ke/hoc-sinh/:id_hoc_sinh`

**Middleware:** `protect`

---

### 5.10. Thống kê theo bài giảng (Giáo viên)

**API:** `GET /api/bai-giang-thuong-mai/thong-ke/bai-giang/:id_bai_giang`

**Middleware:** `protect`

**Response bao gồm:**
- Tổng số lần thi, số học sinh
- Điểm cao nhất, thấp nhất, trung bình
- Phân phối điểm (0-2, 2-4, 4-6, 6-8, 8-10)
- Top 5 học sinh điểm cao nhất
- Chi tiết 20 lần thi gần nhất

---

## 6. LỊCH SỬ THI & THỐNG KÊ (Admin/GV)

### Tổng quan
Module dành cho Admin và Giáo viên để xem lịch sử thi của tất cả học viên, lọc theo nhiều tiêu chí, và xem thống kê tổng quan trên dashboard.

---

### 6.1. Lấy lịch sử thi toàn hệ thống

**API:** `GET /api/lich-su-thi/danh-sach?page=1&limit=10&search=&lop_hoc_id=&bai_giang_id=&hoc_sinh_id=&sortBy=ngay_lam_bai&sortOrder=desc`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Nếu `giaovien` → Chỉ xem bài thi của lớp mình
2. Filter: theo lớp, bài giảng, học sinh
3. Tìm kiếm: theo tên/MSSV/email học sinh, tên bài giảng
4. Tìm kiếm 2 bước: tìm ID thỏa điều kiện trước → Query chính
5. Populate đầy đủ: học sinh, bài giảng, lớp học, giáo viên
6. Phân trang + sắp xếp

---

### 6.2. Lấy danh sách học viên đã thi 1 bài giảng

**API:** `GET /api/lich-su-thi/hoc-vien/:bai_giang_id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Sử dụng **Aggregation Pipeline**:
   - `$match` theo bài giảng
   - `$group` theo học sinh → lấy điểm cao nhất, tổng lần thi
   - `$lookup` join với `nguoidungs`
   - Giới hạn 5 lần thi gần nhất cho mỗi học sinh

---

### 6.3. Lấy chi tiết bài thi

**API:** `GET /api/lich-su-thi/chi-tiet/:id`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Luồng hoạt động:**
1. Tìm kết quả thi theo ID
2. Populate đầy đủ: học sinh, bài giảng (kèm câu hỏi), lớp, giáo viên
3. Kiểm tra quyền giáo viên

---

### 6.4. Thống kê tổng quan (Dashboard)

**API:** `GET /api/lich-su-thi/thong-ke`

**Middleware:** `protect` → `checkRole(['admin', 'giaovien'])`

**Response:**
```json
{
  "success": true,
  "data": {
    "tongBaiThi": 500,
    "tongHocVien": 120,
    "diemTrungBinh": 7.5,
    "diemCaoNhat": 10,
    "diemThapNhat": 1.5,
    "topHocVien": [...],      // Top 10 học viên xuất sắc
    "thongKeNgay": [...]       // Thống kê 7 ngày gần nhất
  }
}
```

**Luồng hoạt động:**
1. Nếu giáo viên → Chỉ thống kê lớp của mình
2. Aggregation: tổng bài thi, distinct học viên, avg/max/min điểm
3. Top 10 học viên: group by ID → sum điểm → sort giảm dần → lookup info
4. Thống kê 7 ngày: group by ngày → đếm bài thi + avg điểm

---

### 6.5. Filter - Lấy danh sách lớp

**API:** `GET /api/lich-su-thi/filter/lop`

---

### 6.6. Filter - Lấy danh sách bài giảng

**API:** `GET /api/lich-su-thi/filter/bai-giang?lop_hoc_id=`

---

## 7. QUẢN LÝ NGƯỜI DÙNG (Admin)

### Tổng quan
Module dành riêng cho Admin để quản lý toàn bộ tài khoản người dùng: tạo, sửa, xóa, phân quyền, khóa/mở khóa, đổi mật khẩu.

---

### 7.1. Lấy danh sách người dùng

**API:** `GET /api/admin/nguoi-dung?page=1&limit=10&search=&role=&isActive=`

**Middleware:** `protect` → `checkRole(['admin'])`

---

### 7.2. Thống kê người dùng

**API:** `GET /api/admin/nguoi-dung/stats`

**Middleware:** `protect` → `checkRole(['admin'])`

---

### 7.3. Lấy chi tiết người dùng

**API:** `GET /api/admin/nguoi-dung/:id`

**Middleware:** `protect` → `checkRole(['admin'])`

---

### 7.4. Tạo người dùng mới

**API:** `POST /api/admin/nguoi-dung`

**Middleware:** `protect` → `checkRole(['admin'])`

---

### 7.5. Cập nhật thông tin người dùng

**API:** `PUT /api/admin/nguoi-dung/:id`

**Middleware:** `protect` → `checkRole(['admin'])`

---

### 7.6. Đổi mật khẩu người dùng

**API:** `PUT /api/admin/nguoi-dung/:id/doi-mat-khau`

**Middleware:** `protect` → `checkRole(['admin'])`

**Request Body:**
```json
{
  "mat_khau_moi": "newpassword123"
}
```

---

### 7.7. Phân quyền

**API:** `PUT /api/admin/nguoi-dung/:id/phan-quyen`

**Middleware:** `protect` → `checkRole(['admin'])`

**Request Body:**
```json
{
  "role": "giaovien"  // admin | giaovien | hocsinh
}
```

---

### 7.8. Khóa/Mở khóa tài khoản

**API:** `PUT /api/admin/nguoi-dung/:id/toggle-status`

**Middleware:** `protect` → `checkRole(['admin'])`

**Luồng hoạt động:**
1. Toggle `isActive` (true ↔ false)
2. Khi khóa → User bị chặn ở middleware `protect` khi gọi bất kỳ API nào

---

### 7.9. Xóa người dùng

**API:** `DELETE /api/admin/nguoi-dung/:id`

**Middleware:** `protect` → `checkRole(['admin'])`

---

## 8. UPLOAD FILE

### Tổng quan
Module upload hỗ trợ 4 loại file: ảnh, video, audio, tài liệu. Sử dụng Multer middleware với cấu hình riêng cho từng loại.

---

### 8.1. Upload ảnh

**API:** `POST /api/upload/image`

**Multer Config:** `uploadImage.js`
- Key: `image`
- Lưu vào: `public/uploads/images/`

---

### 8.2. Upload video

**API:** `POST /api/upload-video/video`

**Multer Config:** `uploadVideo.js`
- Key: `video`
- Lưu vào: `public/uploads/videos/`

---

### 8.3. Upload audio

**API:** `POST /api/upload-audio/audio`

**Multer Config:** `uploadAudio.js`
- Key: `audio`
- Lưu vào: `public/uploads/audios/`

---

### 8.4. Upload tài liệu

**API:** `POST /api/upload-document/document`

**Multer Config:** `uploadDocument.js`
- Key: `document`
- Lưu vào: `public/uploads/docs/`

---

### 8.5. Upload file Word (Import câu hỏi)

**API:** `POST /api/upload-document/word`

- Key: `document`
- Chỉ chấp nhận: `.docx`
- Response trả `filename` và `path` để sử dụng trong API import

---

## 9. TÍCH HỢP TELEGRAM BOT

### Tổng quan
Hệ thống tích hợp Telegram Bot để gửi thông báo phê duyệt bài viết trực tiếp đến Admin qua Telegram. Admin có thể duyệt hoặc xóa bài ngay trên Telegram.

### Thư viện: `telegraf` v4.16.3

### Luồng hoạt động:
1. Khi có bài viết mới cần phê duyệt → Gọi `sendPostNotification(post, authorName)`
2. Bot gửi tin nhắn đến `ADMIN_CHAT_ID` chứa:
   - Tên tác giả
   - Nội dung bài viết
   - Media đính kèm (ảnh/video/audio nếu có)
   - 2 nút inline: **✅ DUYỆT BÀI** | **🗑️ XÓA VĨNH VIỄN**
3. Admin nhấn nút → Bot xử lý:
   - **Duyệt:** `BaiViet.findByIdAndUpdate(postId, { isActive: true })`
   - **Xóa:** `BaiViet.findByIdAndDelete(postId)`
4. Bot cập nhật lại nội dung tin nhắn cũ (hiển thị trạng thái đã xử lý)

---

## 10. HỆ THỐNG FRONTEND - GIAO DIỆN & ROUTING

### 10.1. Cấu trúc Routing

| Path                                    | Component        | Quyền truy cập              | Mô tả                     |
|-----------------------------------------|------------------|------------------------------|----------------------------|
| `/dang-nhap`                            | DangNhap         | Public                       | Trang đăng nhập/đăng ký   |
| `/`                                     | Home             | Tất cả (đã login)            | Trang chủ / Dashboard     |
| `/tai-khoan-cua-toi`                    | TaiKhoanCuaToi   | Tất cả (đã login)            | Thông tin cá nhân          |
| `/lop-hoc`                              | Classes          | Admin, GV, HS                | Quản lý lớp học            |
| `/lop-hoc/bai-giang/:classId/:className`| BaiGiang         | Admin, GV, HS                | Quản lý bài giảng trong lớp|
| `/admin/quan-ly-tai-khoan`              | QuanLyTaiKhoan   | Admin only                   | Quản lý tài khoản          |
| `/admin/lich-su-thi`                    | LichSuThi        | Admin, GV                    | Lịch sử thi hệ thống      |
| `/hoc-sinh/bo-suu-tap`                  | BoSuuTap         | Tất cả                       | Bộ sưu tập bài đã mua     |
| `/hoc-sinh/lam-bai/:id`                 | LamBai           | Tất cả                       | Giao diện làm bài thi     |
| `/403`                                  | ForbiddenPage    | -                             | Trang từ chối truy cập    |

### 10.2. Hệ thống bảo vệ Route

- **`UserProtectedRoute`:** Kiểm tra đã đăng nhập (có token + user) → Nếu chưa → redirect `/dang-nhap`
- **`RoleProtectedRoute`:** Kiểm tra role (admin, giaovien, hocsinh) → Nếu không đủ quyền → redirect `/403`

### 10.3. Layout chính

```
┌──────────────────────────────────────────┐
│              HeaderApp                    │
├──────────┬───────────────────────────────┤
│          │                               │
│ Sidebar  │         Page Content          │
│ (Menu)   │         (Outlet)              │
│          │                               │
│          │                               │
├──────────┴───────────────────────────────┤
│              FooterApp                    │
└──────────────────────────────────────────┘
```

- **DashboardLayout:** Wrapper chứa Header + Sidebar + Content (React Router `<Outlet />`)
- **ThemeSwitcher:** Toggle Dark/Light mode
- **PageTitle:** Dynamically set `document.title`
- **ScrollToTop:** Auto scroll lên đầu khi chuyển trang

### 10.4. State Management

- **AuthContext (React Context API):** Quản lý trạng thái xác thực toàn cục
  - `user`, `token`, `loading`, `isLoggedIn`
  - `handleLogin()`, `handleLogout()`
  - Auto-check token khi reload
  - Auto-logout khi token hết hạn
  - Đồng bộ logout giữa các tab (storage event + focus event)

- **FavoritesContext:** Quản lý danh sách yêu thích

### 10.5. Service Layer

Frontend tách API calls thành các service riêng biệt:

| Service File               | Số hàm | Base URL                     |
|---------------------------|--------|-------------------------------|
| `apiTongQuat.js`          | 1      | Wrapper fetch chung           |
| `apiAuth.js`              | 7      | `/api/auth/*`                 |
| `apiBaiGiang.js`          | 13     | `/api/bai-giang/*`            |
| `apiLopHoc.js`            | 8      | `/api/lop-hoc/*`              |
| `apiLichSuThi.js`         | 5      | `/api/lich-su-thi/*`          |
| `apiQuanLyNguoiDung.js`   | 8      | `/api/admin/nguoi-dung/*`     |
| `baiGiangThuongMaiAPI.js` | 10     | `/api/bai-giang-thuong-mai/*` |
| `uploadAPI.js`            | 5      | `/api/upload*`                |
| `nguoiDungService.js`     | -      | `/api/nguoidung/*`            |

---

## TỔNG KẾT DANH SÁCH API

### Auth APIs (8 endpoints)
| Method | Endpoint                       | Mô tả                        |
|--------|--------------------------------|-------------------------------|
| POST   | `/api/auth/register`           | Đăng ký (gửi OTP)            |
| POST   | `/api/auth/verify-register`    | Xác thực OTP + tạo tài khoản |
| POST   | `/api/auth/login`              | Đăng nhập                     |
| POST   | `/api/auth/logout`             | Đăng xuất                     |
| GET    | `/api/auth/me`                 | Lấy thông tin cá nhân         |
| PUT    | `/api/auth/doi-mat-khau`       | Đổi mật khẩu                  |
| PUT    | `/api/auth/cap-nhat-thong-tin` | Cập nhật thông tin             |
| POST   | `/api/auth/forgot-password`    | Quên mật khẩu                 |

### Lớp học APIs (7 endpoints)
| Method | Endpoint                            | Mô tả                          |
|--------|-------------------------------------|---------------------------------|
| POST   | `/api/lop-hoc`                      | Tạo lớp mới                    |
| GET    | `/api/lop-hoc`                      | Danh sách lớp học               |
| GET    | `/api/lop-hoc/:id`                  | Chi tiết lớp                    |
| PUT    | `/api/lop-hoc/:id`                  | Cập nhật lớp                    |
| DELETE | `/api/lop-hoc/:id`                  | Xóa lớp                         |
| PUT    | `/api/lop-hoc/:id/refresh-code`     | Đổi mã lớp                      |
| POST   | `/api/lop-hoc/join-by-code`         | HS xin vào lớp                  |
| PUT    | `/api/lop-hoc/approve-student`      | GV phê duyệt HS                |

### Bài giảng APIs (13 endpoints)
| Method | Endpoint                                    | Mô tả                          |
|--------|---------------------------------------------|---------------------------------|
| POST   | `/api/bai-giang`                            | Tạo bài giảng                   |
| GET    | `/api/bai-giang`                            | Danh sách bài giảng              |
| GET    | `/api/bai-giang/:id`                        | Chi tiết bài giảng               |
| PUT    | `/api/bai-giang/:id`                        | Cập nhật bài giảng               |
| DELETE | `/api/bai-giang/:id`                        | Xóa bài giảng                    |
| GET    | `/api/bai-giang/lop-hoc/:id_lop_hoc`       | Bài giảng theo lớp               |
| POST   | `/api/bai-giang/:id/cau-hoi`               | Thêm 1 câu hỏi                  |
| POST   | `/api/bai-giang/:id/cau-hoi/nhieu`         | Thêm nhiều câu hỏi              |
| PUT    | `/api/bai-giang/:id/cau-hoi/:cauHoiId`     | Sửa câu hỏi                     |
| DELETE | `/api/bai-giang/:id/cau-hoi/:cauHoiId`     | Xóa câu hỏi                     |
| PUT    | `/api/bai-giang/:id/cau-hoi/sap-xep`       | Sắp xếp câu hỏi                 |
| POST   | `/api/bai-giang/:id/cau-hoi/import-word`   | Import từ Word                   |
| GET    | `/api/bai-giang/thong-ke/tong-quan`        | Thống kê bài giảng               |

### Thương mại APIs (10 endpoints)
| Method | Endpoint                                              | Mô tả                          |
|--------|-------------------------------------------------------|---------------------------------|
| POST   | `/api/bai-giang-thuong-mai/mua-bai-giang`            | Mua bài giảng                    |
| GET    | `/api/bai-giang-thuong-mai/danh-sach-da-mua`         | DS đã mua                        |
| GET    | `/api/bai-giang-thuong-mai/bai-thi/:id`              | Lấy bài thi                      |
| POST   | `/api/bai-giang-thuong-mai/nop-bai-thi`              | Nộp bài thi                      |
| GET    | `/api/bai-giang-thuong-mai/xem-dap-an/:id`           | Xem đáp án                       |
| GET    | `/api/bai-giang-thuong-mai/lich-su-thi`              | Lịch sử thi (HS)                 |
| GET    | `/api/bai-giang-thuong-mai/tien-do-hoc-tap`          | Tiến độ học tập                   |
| GET    | `/api/bai-giang-thuong-mai/thong-ke/lop/:id`         | Thống kê theo lớp (GV)           |
| GET    | `/api/bai-giang-thuong-mai/thong-ke/hoc-sinh/:id`    | Thống kê theo HS (GV)            |
| GET    | `/api/bai-giang-thuong-mai/thong-ke/bai-giang/:id`   | Thống kê theo bài giảng (GV)     |

### Lịch sử thi APIs (6 endpoints)
| Method | Endpoint                              | Mô tả                          |
|--------|---------------------------------------|---------------------------------|
| GET    | `/api/lich-su-thi/danh-sach`         | DS lịch sử thi (Admin/GV)       |
| GET    | `/api/lich-su-thi/hoc-vien/:id`      | HS đã thi 1 bài giảng           |
| GET    | `/api/lich-su-thi/chi-tiet/:id`      | Chi tiết bài thi                 |
| GET    | `/api/lich-su-thi/thong-ke`          | Thống kê dashboard               |
| GET    | `/api/lich-su-thi/filter/lop`        | Filter danh sách lớp             |
| GET    | `/api/lich-su-thi/filter/bai-giang`  | Filter danh sách bài giảng       |

### Quản lý người dùng APIs (9 endpoints)
| Method | Endpoint                                      | Mô tả                          |
|--------|-----------------------------------------------|---------------------------------|
| GET    | `/api/admin/nguoi-dung`                       | DS người dùng                    |
| GET    | `/api/admin/nguoi-dung/stats`                 | Thống kê người dùng             |
| GET    | `/api/admin/nguoi-dung/:id`                   | Chi tiết người dùng              |
| POST   | `/api/admin/nguoi-dung`                       | Tạo người dùng                   |
| PUT    | `/api/admin/nguoi-dung/:id`                   | Cập nhật người dùng              |
| PUT    | `/api/admin/nguoi-dung/:id/doi-mat-khau`      | Đổi mật khẩu                    |
| PUT    | `/api/admin/nguoi-dung/:id/phan-quyen`        | Phân quyền                       |
| PUT    | `/api/admin/nguoi-dung/:id/toggle-status`     | Khóa/Mở khóa                    |
| DELETE | `/api/admin/nguoi-dung/:id`                   | Xóa người dùng                   |

### Người dùng APIs (6 endpoints - route cũ)
| Method | Endpoint                                | Mô tả                          |
|--------|----------------------------------------|---------------------------------|
| GET    | `/api/nguoidung`                       | DS người dùng                    |
| GET    | `/api/nguoidung/:id`                   | Chi tiết                         |
| POST   | `/api/nguoidung`                       | Tạo mới (Admin)                  |
| PUT    | `/api/nguoidung/:id`                   | Cập nhật (Admin)                 |
| PUT    | `/api/nguoidung/toggle-active/:id`     | Toggle active (Admin)            |
| DELETE | `/api/nguoidung/:id`                   | Xóa (Admin)                      |

### Upload APIs (5 endpoints)
| Method | Endpoint                            | Mô tả                          |
|--------|-------------------------------------|---------------------------------|
| POST   | `/api/upload/image`                | Upload ảnh                       |
| POST   | `/api/upload-video/video`          | Upload video                     |
| POST   | `/api/upload-audio/audio`          | Upload audio                     |
| POST   | `/api/upload-document/document`    | Upload tài liệu                 |
| POST   | `/api/upload-document/word`        | Upload file Word                 |

---

**TỔNG CỘNG: ~64 API endpoints**
