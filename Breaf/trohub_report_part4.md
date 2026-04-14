# 📘 BÁO CÁO PHÂN TÍCH CHI TIẾT DỰ ÁN TROHUB

## Phần 4/4 — Luồng Nghiệp Vụ, Bảo Mật, Câu Hỏi Bảo Vệ & Phát Triển

---

# CHƯƠNG 16: LUỒNG NGHIỆP VỤ CHI TIẾT

## 16.1. Luồng Đăng Ký Tài Khoản

```
┌─────────────────────────────────────────────────────────┐
│         LUỒNG ĐĂNG KÝ BẰNG EMAIL                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User mở trang /dang-nhap                           │
│  2. Chọn tab "Đăng ký"                                  │
│  3. Nhập: fullname, email, password                     │
│     │                                                   │
│     ▼                                                   │
│  4. Client: apiRegisterWithEmail(data)                  │
│     POST /api/v1/auth/register-email                    │
│     │                                                   │
│     ▼                                                   │
│  5. Server:                                             │
│     ├── Validate input (Joi): email hợp lệ? pwd có?    │
│     ├── Kiểm tra email đã tồn tại?                     │
│     │   ├── Có → "Email đã được đăng ký."              │
│     │   └── Chưa → Tiếp tục                            │
│     ├── Hash password: bcrypt.hash(pwd, 10)             │
│     └── Tạo user: db.User.create({...})                │
│         Role mặc định: "Thành viên"                     │
│     │                                                   │
│     ▼                                                   │
│  6. Server trả về: { success: true, msg: "Thành công" } │
│  7. Client hiện toast thành công                        │
│  8. User quay lại tab "Đăng nhập"                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 16.2. Luồng Đăng Nhập

```
┌─────────────────────────────────────────────────────────┐
│              LUỒNG ĐĂNG NHẬP EMAIL                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User nhập email + password → Click "Đăng nhập"        │
│     │                                                   │
│     ▼                                                   │
│  Client: apiLoginWithEmail({ email, password })         │
│     │                                                   │
│     ▼                                                   │
│  Server:                                                │
│  ├── Tìm user bằng email                               │
│  │   └── Không tìm thấy → "Email chưa được đăng ký!"  │
│  ├── So sánh password hash                              │
│  │   └── Sai → "Mật khẩu không chính xác!"            │
│  ├── Tạo JWT: jwt.sign({ uid: user.id }, SECRET, 7d)   │
│  └── Trả về: { success: true, accessToken: "eyJ..." }  │
│     │                                                   │
│     ▼                                                   │
│  Client:                                                │
│  ├── useMeStore.setToken(accessToken)                   │
│  │   → Lưu vào localStorage: trohub/me                 │
│  ├── App.jsx detect token change → gọi getMe()         │
│  │   → GET /api/v1/user/me (có Authorization header)   │
│  │   → Server decode token → tìm user → trả user info  │
│  │   → useMeStore.setMe(user)                          │
│  └── UI cập nhật: Header hiện avatar + tên             │
│     │                                                   │
│     ▼                                                   │
│  User đã đăng nhập thành công! ✅                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 16.3. Luồng Tạo Tin Đăng (Owner)

```
Bước 1: Điều kiện tiên quyết
    ├── Đã đăng nhập ✅
    ├── Role = "Chủ trọ" ✅
    └── Có đủ số dư ✅

Bước 2: Điền form tạo tin
    ├── Tiêu đề: "Phòng trọ cao cấp Q1 HCM"
    ├── Mô tả: (Rich text với Quill editor)
    ├── Loại: "Cho thuê phòng trọ"
    ├── Địa chỉ:
    │   ├── Tỉnh/Thành: "Hồ Chí Minh"
    │   ├── Quận/Huyện: "Quận 1"
    │   └── Phường/Xã: "Phường Bến Nghé"
    ├── Giá: 3,500,000 VNĐ/tháng
    ├── Diện tích: 25 m²
    ├── Phòng ngủ: 1, Phòng tắm: 1
    ├── Ảnh: Upload 5 ảnh qua Dropbox
    ├── Tiện ích: [WiFi, Điều hòa]
    ├── Giới tính: "Tất cả"
    └── Gói ưu tiên: "Vàng" (60,000 VNĐ/ngày)

Bước 3: Chọn thời gian đăng
    ├── Số ngày: 7 ngày
    └── Tổng tiền: 60,000 × 7 = 420,000 VNĐ

Bước 4: Submit
    ├── Client validate form
    ├── POST /api/v1/post/new
    ├── Middleware: verifyToken → isOwner → validateDto
    └── Controller:
        ├── Tạo Post record (status = "Đang chờ duyệt")
        ├── Tạo Order record (status = "Đang chờ")
        └── Trả về success

Bước 5: Admin duyệt tin
    ├── Admin xem tin mới trên dashboard
    ├── Click "Duyệt" hoặc "Từ chối"
    ├── PUT /api/v1/post/update-status/:id
    ├── Cập nhật Post.status = "Đã duyệt"
    ├── Cập nhật Order.confirmedDate = NOW
    └── Gửi email thông báo cho chủ trọ

Bước 6: Chủ trọ thanh toán (Công khai tin)
    ├── Vào "Quản lý hóa đơn"
    ├── Click "Công khai" trên order
    ├── PUT /api/v1/order/public-post/:id
    ├── Order.status = "Thành công"
    ├── Post.expiredDate = NOW + orderedDays
    ├── User.balance -= total (trừ tiền)
    └── Tin đăng xuất hiện trên trang tìm kiếm
```

## 16.4. Luồng Nạp Tiền VNPay

```
┌──────────────────────────────────────────────────┐
│              LUỒNG NẠP TIỀN VNPAY                │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. User: Chọn số tiền nạp: 500,000 VNĐ        │
│     Click "Nạp tiền VNPay"                       │
│        │                                         │
│        ▼                                         │
│  2. Client: POST /api/v1/payment/deposit         │
│     Body: { amount: 500000 }                     │
│        │                                         │
│        ▼                                         │
│  3. Server: Tạo VNPay Payment URL                │
│     ├── Tạo params: amount, orderId, returnUrl   │
│     ├── Sắp xếp params alphabetically            │
│     ├── Ký HMAC-SHA512 với HashSecret            │
│     └── Trả URL cho client                       │
│        │                                         │
│        ▼                                         │
│  4. Client: window.location = paymentUrl         │
│     Browser chuyển đến VNPay gateway              │
│        │                                         │
│        ▼                                         │
│  5. User: Chọn ngân hàng, nhập thẻ ATM          │
│     VNPay xử lý giao dịch                       │
│        │                                         │
│        ▼                                         │
│  6. VNPay redirect:                              │
│     GET /api/v1/payment/vnpay-return?params...   │
│        │                                         │
│        ▼                                         │
│  7. Server xử lý callback:                       │
│     ├── Xác minh signature (chống giả mạo)       │
│     │   └── Sai → Redirect /thanh-toan/97        │
│     ├── Check transaction status                  │
│     │   └── Thất bại → Redirect /thanh-toan/02   │
│     ├── Parse amount và userId                    │
│     ├── db.User.increment("balance", amount)     │
│     ├── db.Payment.create({...})                 │
│     └── Redirect /thanh-toan/00 (thành công)     │
│        │                                         │
│        ▼                                         │
│  8. Client: Trang PaymentNotice hiện kết quả     │
│     ├── Code "00" → "Nạp tiền thành công!" ✅   │
│     ├── Code "02" → "Giao dịch thất bại" ❌     │
│     └── Code "97" → "Chữ ký không hợp lệ" ⚠️   │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 16.5. Luồng Tìm Kiếm Phòng Trọ

```
1. User truy cập /tim-kiem hoặc nhấn vào filter trên Homepage

2. Search Store cập nhật:
   setCurrentSearchParams({ type: "province", value: "Hà Nội" })
   setCurrentSearchParams({ type: "price", value: "[1000000,3000000]" })
   setCurrentSearchParams({ type: "convenient", value: ["WiFi","Điều hòa"] })

3. Component đọc từ searchStore → build query params:
   { province: "Hà Nội", price: "[1000000,3000000]", convenient: ["WiFi"] }

4. SWR Hook gọi API:
   GET /api/v1/post/public?province=Hà%20Nội&price=[1000000,3000000]&...

5. Server xây dựng WHERE clause:
   WHERE province ILIKE '%Hà Nội%'
     AND price BETWEEN 1000000 AND 3000000
     AND convenient ILIKE '%WiFi%' OR convenient ILIKE '%Điều hòa%'
     AND expiredDate >= NOW
     AND status = 'Đã duyệt'
   ORDER BY priority DESC
   LIMIT 5 OFFSET 0

6. Kết quả trả về → SWR cache → React render danh sách PostCard
```

## 16.6. Luồng Đánh Giá & Bình Luận

```
Đánh Giá Sao:
  1. User click vào 4 sao trên DetailPost
  2. POST /api/v1/post/rating { star: 4, idPost: 123 }
  3. Server:
     ├── Kiểm tra đã đánh giá chưa?
     │   ├── Rồi → UPDATE Rating SET star = 4
     │   └── Chưa → INSERT Rating (uid, postId, star)
     ├── Tính trung bình sao MỚI: SELECT AVG(star) FROM Ratings WHERE idPost=123
     ├── Cập nhật Post.averageStar = 4.2
     └── Trả về thành công
  4. Client refresh data → hiện sao mới

Bình Luận:
  1. User gõ bình luận + nhấn "Gửi"
  2. POST /api/v1/post/comment-new { content: "Phòng đẹp!", idPost: 123 }
  3. Server: INSERT Comment (uid, idPost, content)
  4. Client refresh → hiện bình luận mới
```

## 16.7. Luồng Quên Mật Khẩu

```
1. User click "Quên mật khẩu?" → Trang /Reset-mat-khau
2. Nhập email → Click "Gửi mã OTP"
3. POST /api/v1/user/reset-password-required { email }
4. Server:
   ├── Tìm user bằng email
   ├── Tạo OTP 6 số: randomstring.generate({ length: 6, charset: "numeric" })
   ├── Lưu OTP + thời hạn (5 phút) vào user record
   └── Gửi email chứa OTP
5. User nhận email, nhập OTP + mật khẩu mới
6. POST /api/v1/user/reset-password-verify { email, otp, password }
7. Server:
   ├── Kiểm tra OTP đúng?
   ├── OTP còn hạn? (resetPwdExpiry > NOW)
   ├── Hash mật khẩu mới: bcrypt.hash(password, 10)
   ├── Cập nhật password + xóa OTP
   └── Trả về thành công
8. User đăng nhập bằng mật khẩu mới
```

## 16.8. Luồng Xác Minh Điện Thoại (SMS OTP)

```
1. User vào /thanh-vien/cap-nhat-so-dien-thoai
2. Nhập SĐT (format +84...) → Click "Gửi OTP"
3. POST /api/v1/user/send-otp { phone: "+84901234567" }
4. Server:
   ├── Kiểm tra SĐT đã được user khác dùng?
   └── Gọi Twilio API: client.verify.v2.services(sid).verifications.create(...)
       → Twilio gửi SMS chứa mã OTP đến SĐT
5. User nhận SMS, nhập OTP
6. POST /api/v1/user/verify-otp { phone, code: "123456" }
7. Server:
   ├── Gọi Twilio API: verificationChecks.create({ to: phone, code })
   ├── Twilio xác nhận OTP đúng
   ├── Cập nhật User: phone = "0901234567", phoneVerified = true
   └── Trả về thành công
```

## 16.9. Luồng Nâng Cấp Thành Chủ Trọ

```
Điều kiện:
  ✅ Đã xác minh email (emailVerified = true)
  ✅ Đã xác minh SĐT (phoneVerified = true)
  ✅ Số dư > 0 (balance > 0)

Luồng:
  1. User click "Nâng cấp Chủ trọ"
  2. PUT /api/v1/user/upgrade-owner
  3. Server:
     ├── Kiểm tra 3 điều kiện trên
     │   └── Chưa đủ → "Bạn chưa đủ điều kiện"
     ├── Cập nhật: User.role = "Chủ trọ"
     └── Trả về: "Nâng cấp thành công, hãy đăng nhập lại"
  4. User đăng nhập lại → Sidebar hiện thêm menu "Chủ trọ"
```

---

# CHƯƠNG 17: BẢO MẬT & XÁC THỰC

## 17.1. Tổng Quan Bảo Mật

```
┌─────────────────────────────────────────────────────┐
│              CÁC LỚP BẢO MẬT TROHUB                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 🔐 Mã Hóa Mật Khẩu (Bcrypt)                   │
│     └── Hash 1 chiều, salt round = 10               │
│                                                     │
│  2. 🎫 JWT Token Authentication                     │
│     └── Token 7 ngày, ký với HMAC-SHA256            │
│                                                     │
│  3. 👑 Role-Based Access Control (RBAC)             │
│     └── 3 roles: Thành viên, Chủ trọ, Admin        │
│                                                     │
│  4. ✅ Input Validation (Joi)                        │
│     └── Kiểm tra type, format, required             │
│                                                     │
│  5. 🌐 CORS Protection                              │
│     └── Chỉ cho phép từ CLIENT_URL                  │
│                                                     │
│  6. 📞 OTP Verification (Twilio + Email)            │
│     └── 6 số, hết hạn sau 5 phút                   │
│                                                     │
│  7. 💳 Payment Signature Verification               │
│     └── HMAC-SHA512 (VNPay), SHA256 (MoMo)         │
│                                                     │
│  8. 🔒 SQL Injection Prevention (Sequelize ORM)     │
│     └── Parameterized queries tự động               │
│                                                     │
│  9. 🧹 XSS Prevention (DOMPurify)                   │
│     └── Sanitize HTML content trước khi render      │
│                                                     │
│ 10. 🔄 Transaction (Database)                       │
│     └── Atomic operations cho payment               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 17.2. Chi Tiết Từng Lớp Bảo Mật

### Bcrypt Password Hashing
```javascript
// Đăng ký: Hash mật khẩu trước khi lưu
const hashedPassword = await bcrypt.hash("mypassword123", 10)
// Kết quả: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//           ↑   ↑          ↑
//        bcrypt rounds    salt (random)

// Đăng nhập: So sánh hash
const isMatch = bcrypt.compareSync("mypassword123", hashedPassword)
// → true (mật khẩu khớp)
```

### JWT Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← HEADER (algorithm + type)
.eyJ1aWQiOjEyMywiaWF0IjoxNzEzMDg4MDAwLCJleHAiOjE3MTM2OTI4MDB9  ← PAYLOAD
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                    ← SIGNATURE

Decoded PAYLOAD:
{
  "uid": 123,          ← User ID (server dùng để xác định user)
  "iat": 1713088000,   ← Issued At (thời gian tạo)
  "exp": 1713692800    ← Expires (hết hạn sau 7 ngày)
}
```

### CORS Protection
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,  // Chỉ cho http://localhost:5173
  methods: ["POST", "GET", "PATCH", "DELETE", "PUT"],
}))
// Nếu request từ domain khác → BLOCKED!
```

---

# CHƯƠNG 18: CÂU HỎI BẢO VỆ & TRÌNH BÀY

## 18.1. Câu Hỏi Về Kiến Trúc & Hệ Thống

### Q1: Dự án của em sử dụng kiến trúc gì?
**Trả lời:** Dự án sử dụng kiến trúc **Client-Server 3 tầng** (3-Tier Architecture):
- **Tầng Presentation (Frontend):** React + Vite, chạy trên trình duyệt (port 5173)
- **Tầng Application (Backend):** Node.js + Express, xử lý logic nghiệp vụ (port 8888)
- **Tầng Data:** PostgreSQL, lưu trữ dữ liệu (port 5432)
Frontend giao tiếp với Backend qua **RESTful API** (HTTP protocol, JSON format).

### Q2: Tại sao chọn React mà không chọn Angular/Vue?
**Trả lời:** React được chọn vì:
1. **Cộng đồng lớn nhất** → dễ tìm giải pháp, tài liệu phong phú
2. **Component-based** → tái sử dụng code, dễ bảo trì
3. **Virtual DOM** → hiệu năng cao khi cập nhật UI
4. **Hệ sinh thái phong phú** → có sẵn nhiều thư viện: Radix UI, SWR, Zustand...
5. **Được hỗ trợ bởi Meta (Facebook)** → ổn định, cập nhật liên tục

### Q3: Tại sao dùng PostgreSQL mà không dùng MySQL?
**Trả lời:** PostgreSQL phù hợp hơn vì:
1. Hỗ trợ **ILIKE** (case-insensitive search) → quan trọng cho tìm kiếm tiếng Việt
2. Hỗ trợ **JSONB** → lưu trữ media và tiện ích linh hoạt
3. Standard compliance tốt hơn
4. Hỗ trợ **transaction** mạnh mẽ → quan trọng cho thanh toán

### Q4: API versioning (/api/v1/) có ý nghĩa gì?
**Trả lời:** API versioning giúp:
- Khi cần thay đổi logic API, tạo version mới `/api/v2/` mà không ảnh hưởng client cũ
- Client cũ vẫn dùng `/api/v1/`, client mới dùng `/api/v2/`
- Đảm bảo **backward compatibility** (tương thích ngược)

## 18.2. Câu Hỏi Về Bảo Mật

### Q5: Làm sao bảo vệ password người dùng?
**Trả lời:** Password được bảo vệ bằng **bcrypt** với salt round = 10:
- Password KHÔNG BAO GIỜ lưu dạng text thuần
- Bcrypt tạo **hash 1 chiều** → không thể giải ngược
- Mỗi lần hash tạo kết quả khác nhau (do random salt)
- Salt round = 10 → đủ an toàn, không quá chậm

### Q6: JWT Token hoạt động như thế nào?
**Trả lời:** JWT (JSON Web Token) là cơ chế xác thực stateless:
1. User đăng nhập → Server tạo token chứa `{ uid: 123 }`, ký với secret key
2. Client lưu token vào localStorage
3. Mỗi request gửi kèm token trong header: `Authorization: Bearer xxx`
4. Server giải mã token → biết user ID → xử lý request
5. Token hết hạn sau 7 ngày → user phải đăng nhập lại

### Q7: Middleware xác thực hoạt động ra sao?
**Trả lời:** Middleware là "bảo vệ cổng" trước controller:
1. `verifyToken`: Kiểm tra JWT token hợp lệ → gắn `req.user = { uid }` → cho đi tiếp
2. `isAdmin`: Kiểm tra role = "Quản trị viên" → chỉ admin mới qua
3. `isOwner`: Kiểm tra role = "Chủ trọ" → chỉ chủ trọ mới qua
4. `validateDto`: Kiểm tra data đầu vào hợp lệ (Joi schema)

### Q8: Hệ thống chống SQL Injection như thế nào?
**Trả lời:** Sequelize ORM tự động sử dụng **parameterized queries**:
```javascript
// Code viết:
db.User.findOne({ where: { email: userInput } })
// SQL thực tế:
// SELECT * FROM "Users" WHERE "email" = $1
// Parameters: ['user_input_here']
```
Dữ liệu user nhập vào KHÔNG BAO GIỜ được nối trực tiếp vào SQL query → an toàn.

### Q9: CORS bảo vệ điều gì?
**Trả lời:** CORS (Cross-Origin Resource Sharing) giới hạn domain nào được phép gọi API:
- Chỉ `http://localhost:5173` được gọi API server
- Website độc hại từ domain khác sẽ bị browser BLOCK
- Ngăn chặn CSRF (Cross-Site Request Forgery) attacks

## 18.3. Câu Hỏi Về Frontend

### Q10: Zustand là gì? Tại sao không dùng Redux?
**Trả lời:** Zustand là thư viện state management nhẹ:
- **Redux**: Quá phức tạp (actions, reducers, store, middleware...) → ~500 dòng code boilerplate
- **Zustand**: Đơn giản, chỉ cần 30 dòng code → Phù hợp dự án vừa và nhỏ
- Zustand dùng hooks natively → tích hợp tốt với React
- Hỗ trợ persist (lưu vào localStorage) built-in

### Q11: SWR khác Axios như thế nào?
**Trả lời:**
- **Axios**: Thư viện HTTP client — chỉ gửi request và nhận response
- **SWR**: Thư viện **data fetching** — bọc ngoài Axios và thêm:
  - Cache dữ liệu → Load nhanh hơn
  - Auto revalidate khi focus tab
  - Auto retry khi lỗi mạng
  - Deduplication (gộp request trùng lặp)

### Q12: Request Interceptor dùng làm gì?
**Trả lời:** Interceptor là "bộ lọc" chạy tự động trước mỗi request:
- Đọc token từ localStorage
- Gắn vào header: `Authorization: Bearer eyJ...`
- Không cần viết code gắn token ở mỗi API call → DRY (Don't Repeat Yourself)

### Q13: Mô hình routing trong dự án?
**Trả lời:** Dự án dùng **React Router v6** với nested routes:
- Route cha (Layout) bọc route con (Page)
- `<Outlet />` là nơi render route con
- 4 layout: PublicLayout, UserLayout, OwnerLayout, AdminLayout
- Mỗi layout có sidebar riêng theo role

## 18.4. Câu Hỏi Về Backend

### Q14: Controller xử lý phân trang như thế nào?
**Trả lời:**
```javascript
// Server-side pagination
const limit = 5                                    // Số item mỗi trang
const page = 1                                     // Trang hiện tại
const offset = (page - 1) * limit                  // Vị trí bắt đầu = 0
const posts = await db.Post.findAll({ limit, offset }) // LIMIT 5 OFFSET 0
const count = await db.Post.count()                 // Tổng số tin đăng
const totalPages = Math.ceil(count / limit)         // Tổng số trang
```

### Q15: Cron Job dùng để làm gì?
**Trả lời:** Cron Job là tác vụ chạy tự động theo lịch. TroHub dùng để:
- Quét tin đăng **hết hạn** mỗi ngày lúc 20:16
- Gửi **email thông báo** cho chủ trọ khi tin hết hạn
- Cú pháp: `"16 20 * * *"` = phút 16, giờ 20, mỗi ngày

### Q16: Giải thích cơ chế thanh toán VNPay
**Trả lời:** VNPay sử dụng cơ chế **redirect với chữ ký số**:
1. Server tạo URL thanh toán với các tham số + ký HMAC-SHA512
2. Browser chuyển đến VNPay → User thanh toán
3. VNPay redirect về server kèm kết quả + chữ ký mới
4. Server xác minh chữ ký → đảm bảo data không bị sửa
5. Nếu thành công → cộng tiền vào tài khoản

### Q17: Tại sao MoMo payment cần Transaction?
**Trả lời:** MoMo gọi 2 callbacks (redirect + IPN) → server có thể nhận 2 request cùng lúc cho cùng 1 giao dịch. Nếu không dùng Transaction:
- Request 1: Cộng 500K → balance = 500K ✅
- Request 2: Cộng 500K → balance = 1M ❌ (cộng 2 lần!)

Transaction + Lock đảm bảo chỉ xử lý DUY NHẤT 1 lần.

## 18.5. Câu Hỏi Về Database

### Q18: Dự án có bao nhiêu bảng? Kể tên và mục đích?
**Trả lời:** 12 bảng:
1. **Users**: Thông tin người dùng
2. **Posts**: Tin đăng cho thuê
3. **Orders**: Hóa đơn đăng tin
4. **Payments**: Lịch sử nạp tiền
5. **Comments**: Bình luận
6. **Ratings**: Đánh giá sao
7. **Wishlists**: Tin yêu thích
8. **SeenPosts**: Tin đã xem
9. **News**: Tin tức
10. **Expireds**: Gia hạn tin
11. **Views**: Thống kê truy cập
12. (implicit via migrations)

### Q19: Sequelize ORM là gì? Lợi ích?
**Trả lời:** ORM (Object-Relational Mapping) giúp:
- Viết JavaScript thay vì SQL thuần
- Tự động tạo SQL queries an toàn (chống SQL injection)
- Hỗ trợ migrations (quản lý thay đổi schema)
- Hỗ trợ associations (quan hệ giữa các bảng)
- Portable: dễ chuyển từ PostgreSQL sang MySQL

### Q20: Migration là gì?
**Trả lời:** Migration là cách quản lý thay đổi database schema theo thời gian:
- Mỗi file migration = 1 thay đổi (tạo bảng, thêm cột...)
- Có thể **migrate up** (áp dụng) hoặc **migrate down** (rollback)
- Làm việc nhóm: ai cũng có thể chạy migrations để có cùng database schema

## 18.6. Câu Hỏi Về Tính Năng

### Q21: Hệ thống filter/search hoạt động ra sao?
**Trả lời:** Filter sử dụng **dynamic WHERE clause**:
- Mỗi filter (giá, diện tích, vị trí...) thêm điều kiện vào `whereClause`
- Sử dụng Sequelize operators: `Op.iLike` (tìm kiếm không phân biệt hoa thường), `Op.between` (khoảng giá), `Op.gte` (lớn hơn hoặc bằng)
- Kết quả sắp xếp theo `priority DESC` → tin ưu tiên cao hiển thị trước

### Q22: Hệ thống gói ưu tiên hoạt động thế nào?
**Trả lời:** Mỗi tin đăng có field `priority` (0-5):
- Kim Cương (5) → hiển thị đầu → giá cao nhất
- Thường (0) → hiển thị cuối → giá thấp nhất
- Query sắp xếp: `ORDER BY priority DESC` → tin priority cao xuất hiện trước

### Q23: Hệ thống đánh giá sao hoạt động thế nào?
**Trả lời:**
- Mỗi user chỉ được đánh giá 1 lần/tin (có thể sửa)
- Khi đánh giá → tính trung bình: `AVG(star)` từ tất cả ratings
- Cập nhật `Post.averageStar` → hiển thị trên PostCard

### Q24: Upload ảnh hoạt động như nào?
**Trả lời:** Dự án sử dụng **Dropbox** để lưu trữ ảnh:
- Client upload ảnh lên Dropbox qua Dropbox Chooser
- Nhận lại URL ảnh từ Dropbox
- Lưu URL vào database (field `media` dạng JSON array)
- Khi hiển thị: load ảnh từ Dropbox CDN

## 18.7. Câu Hỏi Nâng Cao

### Q25: Nếu phải mở rộng hệ thống cho 10,000 người dùng?
**Trả lời:**
1. **Database indexing**: Thêm index cho các cột hay query (email, province, status)
2. **Redis cache**: Cache kết quả tìm kiếm phổ biến
3. **CDN**: Tải ảnh qua CDN thay vì trực tiếp
4. **Load balancer**: Chạy nhiều server instances
5. **Database read replicas**: Tách read/write

### Q26: Refresh Token?
**Trả lời:** Hiện tại dự án dùng **Access Token 7 ngày**. Để cải thiện:
- Tạo 2 token: Access (15 phút) + Refresh (7 ngày)
- Access hết hạn → dùng Refresh để lấy Access mới
- An toàn hơn vì Access token ngắn hạn

### Q27: Điểm yếu của hệ thống hiện tại?
**Trả lời** (thể hiện bạn hiểu sâu):
1. Chưa có refresh token → token bị đánh cắp = mất toàn quyền 7 ngày
2. Chưa có rate limiting → có thể bị brute force
3. Payment callback chưa retry → có thể mất tiền nếu server down lúc callback
4. Chưa có real-time notifications (WebSocket)
5. Chưa có unit tests

### Q28: Tailwind kết hợp với Radix UI như thế nào?
**Trả lời:** 
- **Radix UI** cung cấp **unstyled, accessible** primitives (Dialog, Dropdown, Tabs...)
- **TailwindCSS** cung cấp utility classes cho **styling**
- Kết hợp: Radix xử lý behavior (mở/đóng, keyboard nav...), Tailwind xử lý giao diện
- Dùng `class-variance-authority (CVA)` để tạo component variants

---

# CHƯƠNG 19: HƯỚNG PHÁT TRIỂN

## 19.1. Tính Năng Có Thể Mở Rộng

| # | Tính năng | Mô tả | Độ phức tạp |
|---|-----------|-------|-------------|
| 1 | Chat real-time | Chat giữa người thuê và chủ trọ | Cao (WebSocket) |
| 2 | Push notification | Thông báo khi tin được duyệt, có comment mới | Trung bình |
| 3 | Advanced search | Tìm kiếm bằng AI/NLP tiếng Việt | Cao |
| 4 | Mobile app | Ứng dụng React Native | Cao |
| 5 | Image optimization | Nén ảnh, lazy loading, thumbnail | Trung bình |
| 6 | Multi-language | Hỗ trợ tiếng Anh | Trung bình |
| 7 | AI Chatbot | Chatbot hỗ trợ tìm phòng | Cao |
| 8 | Analytics dashboard | Thống kê nâng cao cho chủ trọ | Trung bình |
| 9 | Report system | Báo cáo tin đăng sai/lừa đảo | Thấp |
| 10 | Comparison tool | So sánh 2-3 phòng trọ | Trung bình |

## 19.2. Cải Thiện Kỹ Thuật

| # | Cải thiện | Lý do |
|---|-----------|-------|
| 1 | Thêm Unit Tests | Đảm bảo code không bị break khi sửa |
| 2 | Thêm Refresh Token | Bảo mật tốt hơn |
| 3 | Rate Limiting | Chống brute force, DDoS |
| 4 | Redis Cache | Tăng tốc queries phổ biến |
| 5 | Docker | Dễ deploy, nhất quán môi trường |
| 6 | CI/CD Pipeline | Tự động test + deploy |
| 7 | Logging (Winston) | Ghi log chi tiết để debug |
| 8 | API Documentation (Swagger) | Tự động tạo docs cho API |

---

# CHƯƠNG 20: PHỤ LỤC

## 20.1. Danh Sách Tất Cả Environment Variables

### Server .env
```
DB_HOST=localhost              # Database host
DB_PORT=5432                   # Database port
DB_NAME=trohub                 # Database name
DB_USER=postgres               # Database username
DB_PASSWORD=your_password      # Database password
DB_DIALECT=postgres            # Database type

JWT_SECRET=your_jwt_secret     # JWT signing key
PORT=8888                      # Server port
CLIENT_URL=http://localhost:5173  # Frontend URL

SMTP_HOST=smtp.gmail.com       # Email server
SMTP_USER=your@gmail.com       # Email sender
SMTP_PASS=your_app_password    # Email app password

TWILLO_ACCOUNT_SSD=ACxxx       # Twilio Account SID
TWILLO_AUTH_TOKEN=xxx           # Twilio Auth Token
TWILLO_SERVICE_SID=VAxxx       # Twilio Verify SID

VNP_TMNCODE=xxx                # VNPay Terminal Code
VNP_HASHSECRET=xxx             # VNPay Hash Secret
VNP_URL=https://sandbox...     # VNPay Gateway URL
VNP_RETURN_URL=http://...      # VNPay Return URL
VNP_BANKCODE=NCB               # VNPay Bank Code
CLIENT_PAYMENT_RETURN_URL=...  # Client redirect after payment

MOMO_PARTNER_CODE=xxx          # MoMo Partner Code
MOMO_ACCESS_KEY=xxx            # MoMo Access Key
MOMO_SECRET_KEY=xxx            # MoMo Secret Key
MOMO_ENDPOINT=https://...      # MoMo API URL
MOMO_REDIRECT_URL=...          # MoMo Redirect URL
MOMO_IPN_URL=...               # MoMo IPN URL
```

## 20.2. Npm Scripts

### Server
```json
"dev": "nodemon index.js"       // Chạy dev (auto-restart khi sửa code)
"start": "node index.js"        // Chạy production
"migrate": "npx sequelize-cli db:migrate"  // Chạy migrations
"seed": "npx sequelize-cli db:seed:all"    // Insert dữ liệu mẫu
"mockup": "yarn migrate & yarn seed"       // Chạy cả hai
```

### Client
```json
"dev": "vite"                    // Chạy dev server (port 5173)
"build": "vite build"           // Build production
"preview": "vite preview"       // Preview bản build
"lint": "eslint ."              // Kiểm tra code style
```

## 20.3. Cách Chạy Dự Án Từ Đầu

```bash
# Bước 1: Cài PostgreSQL, tạo database "trohub"

# Bước 2: Cài Node.js + Yarn

# Bước 3: Server
cd server
yarn                            # Cài dependencies
cp .env.example .env            # Tạo file .env
# Điền thông tin vào .env
yarn dev                        # Chạy server (port 8888)
yarn mockup                     # Tạo bảng + dữ liệu mẫu

# Bước 4: Client
cd client
yarn                            # Cài dependencies
cp .env.example .env            # Tạo file .env
# Điền thông tin vào .env
yarn dev                        # Chạy client (port 5173)

# Bước 5: Mở http://localhost:5173
```

## 20.4. Tổng Kết Số Liệu Dự Án

| Metric | Giá trị |
|--------|---------|
| Tổng số file source code | ~120+ files |
| Bảng database | 12 bảng |
| API endpoints | ~45 endpoints |
| React pages | ~30 pages |
| React components | ~50+ components |
| Backend controllers | 6 controllers |
| Backend routes | 6 route files |
| Middlewares | 3 middlewares |
| Custom hooks | 3 hooks |
| Zustand stores | 2 stores |
| Cổng thanh toán | 3 (VNPay, MoMo, PayPal) |
| External APIs | 5 (Google, Twilio, OpenStreetMap, VN Admin, ExchangeRate) |
| Dependencies (client) | ~45 packages |
| Dependencies (server) | ~15 packages |

---

## 📌 LỜI KHUYÊN KHI TRÌNH BÀY

1. **Bắt đầu bằng TỔNG QUAN** → đừng đi vào chi tiết ngay
2. **Dùng sơ đồ** để giải thích luồng → dễ hiểu hơn text
3. **Chuẩn bị DEMO LIVE** → đăng nhập, tạo tin, thanh toán
4. **Nói về ĐIỂM YẾU** → cho thấy bạn hiểu sâu hệ thống
5. **Trả lời "Tại sao" trước "Cái gì"** → giáo viên thích nghe reasoning
6. **Tự tin!** → Bạn đã đọc hết report này, bạn hiểu dự án rồi!

---

*Kết thúc báo cáo phân tích dự án TroHub — 4 phần, 20 chương*
