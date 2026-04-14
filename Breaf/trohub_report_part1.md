# 📘 BÁO CÁO PHÂN TÍCH CHI TIẾT DỰ ÁN TROHUB

## Nền Tảng Tìm Kiếm Và Cho Thuê Phòng Trọ Trực Tuyến

**Phần 1/4 — Tổng Quan, Kiến Trúc & Công Nghệ**

---

> [!NOTE]
> Báo cáo này được viết chi tiết nhằm giúp sinh viên mới bắt đầu hiểu rõ từng khía cạnh của dự án TroHub — từ kiến trúc hệ thống, luồng dữ liệu, đến từng dòng code quan trọng. Mục tiêu là giúp bạn tự tin trình bày trước giáo viên.

---

# MỤC LỤC TỔNG THỂ (4 PHẦN)

## Phần 1: Tổng Quan, Kiến Trúc & Công Nghệ (file này)
- Chương 1: Giới Thiệu Tổng Quan Dự Án
- Chương 2: Phân Tích Bài Toán & Yêu Cầu
- Chương 3: Công Nghệ Sử Dụng (Technology Stack)
- Chương 4: Kiến Trúc Hệ Thống (System Architecture)
- Chương 5: Cấu Trúc Thư Mục Dự Án

## Phần 2: Backend Deep-Dive
- Chương 6: Cơ Sở Dữ Liệu & Models
- Chương 7: API Routes & Controllers
- Chương 8: Middleware & Bảo Mật
- Chương 9: Tích Hợp Thanh Toán
- Chương 10: Hệ Thống Email & Cron Job

## Phần 3: Frontend Deep-Dive
- Chương 11: React & Vite Setup
- Chương 12: State Management (Zustand)
- Chương 13: API Layer & SWR
- Chương 14: Routing & Navigation
- Chương 15: Các Trang & Components

## Phần 4: Luồng Hệ Thống, Bảo Mật & Bảo Vệ
- Chương 16: Luồng Nghiệp Vụ Chi Tiết
- Chương 17: Bảo Mật & Xác Thực
- Chương 18: Câu Hỏi Phỏng Vấn & Bảo Vệ
- Chương 19: Hướng Phát Triển
- Chương 20: Phụ Lục

---

# CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN DỰ ÁN

## 1.1. TroHub Là Gì?

**TroHub** là một nền tảng web (website) cho phép người dùng **tìm kiếm, đăng tin và cho thuê phòng trọ trực tuyến** tại Việt Nam. Nói đơn giản, TroHub giống như một "chợ online" dành riêng cho phòng trọ, nhà cho thuê, và căn hộ.

### Ví dụ thực tế để hiểu:
- **Người thuê trọ** (sinh viên, người đi làm) vào TroHub để tìm phòng trọ phù hợp với nhu cầu: giá cả, vị trí, diện tích...
- **Chủ trọ** vào TroHub để đăng tin cho thuê phòng, quản lý tin đăng, nhận đánh giá từ người thuê
- **Quản trị viên** (admin) quản lý toàn bộ hệ thống: duyệt tin, quản lý người dùng, xem thống kê

### Tại sao cần TroHub?
Hiện nay, việc tìm phòng trọ ở Việt Nam còn rất bất cập:
- Thông tin phòng trọ bị phân tán trên nhiều nền tảng (Zalo, Facebook, tờ rơi...)
- Không có thông tin minh bạch về giá cả, tiện ích
- Khó so sánh các phòng trọ với nhau
- Chủ trọ khó tiếp cận người thuê

**TroHub giải quyết** tất cả vấn đề trên bằng cách tập trung mọi thứ vào một nền tảng duy nhất.

## 1.2. Các Tính Năng Chính

### 🏠 Dành cho Người Thuê (Thành viên)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | Tìm kiếm phòng trọ | Tìm theo vị trí, giá, diện tích, tiện ích |
| 2 | Xem chi tiết phòng | Xem ảnh, mô tả, vị trí trên bản đồ |
| 3 | Đánh giá & bình luận | Cho sao + viết nhận xét về phòng trọ |
| 4 | Lưu tin yêu thích | Bookmark các phòng trọ muốn xem lại |
| 5 | Lịch sử đã xem | Xem lại các phòng đã từng xem |
| 6 | Quản lý tài khoản | Cập nhật thông tin, avatar, mật khẩu |
| 7 | Xác minh OTP | Xác minh email và số điện thoại |

### 🔑 Dành cho Chủ Trọ
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | Đăng tin cho thuê | Tạo bài đăng với ảnh, mô tả, giá |
| 2 | Quản lý tin đăng | Sửa, xóa, gia hạn tin |
| 3 | Chọn gói ưu tiên | Kim cương, Bạch kim, Vàng... (tin hiển thị cao hơn) |
| 4 | Quản lý hóa đơn | Xem lịch sử thanh toán, hóa đơn đăng tin |
| 5 | Nạp tiền vào tài khoản | Qua VNPay, MoMo, PayPal |

### 👑 Dành cho Quản Trị Viên (Admin)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | Dashboard thống kê | Xem tổng quan: người dùng, tin đăng, doanh thu |
| 2 | Duyệt tin đăng | Duyệt hoặc từ chối tin đăng của chủ trọ |
| 3 | Quản lý thành viên | Xem, xóa, phân quyền người dùng |
| 4 | Quản lý tin tức | Đăng, sửa, xóa bài tin tức |

## 1.3. Vai Trò Người Dùng (User Roles)

TroHub có **3 vai trò** người dùng:

```
┌─────────────────────────────────────────────────┐
│              HỆ THỐNG PHÂN QUYỀN               │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 Thành viên (Member)                         │
│  ├── Tìm kiếm, xem tin đăng                    │
│  ├── Đánh giá, bình luận                        │
│  ├── Lưu tin yêu thích                          │
│  └── Nạp tiền, quản lý cá nhân                 │
│                                                 │
│  🔑 Chủ trọ (Owner)                             │
│  ├── Tất cả quyền của Thành viên               │
│  ├── Đăng tin cho thuê                           │
│  ├── Quản lý tin đăng                            │
│  └── Quản lý hóa đơn                            │
│                                                 │
│  👑 Quản trị viên (Admin)                        │
│  ├── Tất cả quyền của Thành viên               │
│  ├── Duyệt/từ chối tin đăng                     │
│  ├── Quản lý người dùng                          │
│  ├── Quản lý tin tức                             │
│  └── Xem Dashboard thống kê                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Điều kiện nâng cấp thành Chủ trọ:** Thành viên phải xác minh email + SĐT + có số dư > 0 mới được nâng cấp vai trò.

---

# CHƯƠNG 2: PHÂN TÍCH BÀI TOÁN & YÊU CẦU

## 2.1. Bài Toán Thực Tế

### Vấn đề hiện tại:
1. **Phía người thuê:** Tìm phòng trọ khó khăn, thông tin phân tán, không đáng tin cậy
2. **Phía chủ trọ:** Khó quảng bá, không có nền tảng chuyên nghiệp để quản lý
3. **Vấn đề chung:** Thiếu hệ thống đánh giá, thanh toán không minh bạch

### Giải pháp TroHub:
- Tạo **1 nền tảng tập trung** cho cả người thuê và chủ trọ
- Cung cấp hệ thống **tìm kiếm thông minh** theo nhiều tiêu chí
- Xây dựng hệ thống **đánh giá & bình luận** minh bạch
- Tích hợp **thanh toán trực tuyến** (VNPay, MoMo, PayPal)
- Hỗ trợ **xác minh người dùng** qua OTP

## 2.2. Yêu Cầu Chức Năng (Functional Requirements)

### FR-01: Đăng ký & Đăng nhập
- Đăng ký bằng email hoặc số điện thoại
- Đăng nhập bằng email/SĐT + mật khẩu
- Đăng nhập bằng Google (OAuth 2.0)
- Quên mật khẩu → gửi OTP qua email

### FR-02: Quản lý tin đăng
- Tạo mới tin đăng (tiêu đề, mô tả, ảnh, giá, địa chỉ...)
- Chọn mức ưu tiên hiển thị (Kim cương → Thường)
- Sửa/xóa tin đăng
- Gia hạn tin đăng

### FR-03: Tìm kiếm & Lọc
- Tìm theo tỉnh/thành, quận/huyện, phường/xã
- Lọc theo khoảng giá, diện tích
- Lọc theo tiện ích (WiFi, máy giặt, điều hòa...)
- Sắp xếp theo giá, thời gian, tên

### FR-04: Thanh toán
- Nạp tiền qua VNPay (ngân hàng Việt Nam)
- Nạp tiền qua MoMo (ví điện tử)
- Nạp tiền qua PayPal (quốc tế)
- Xem lịch sử thanh toán

### FR-05: Quản trị hệ thống
- Dashboard tổng quan (biểu đồ, thống kê)
- Duyệt/từ chối tin đăng
- Quản lý người dùng (CRUD)
- Quản lý tin tức

## 2.3. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

| Tiêu chí | Yêu cầu | Cách đạt được |
|----------|---------|---------------|
| Bảo mật | Bảo vệ dữ liệu người dùng | JWT Token, mã hóa Bcrypt |
| Hiệu năng | Phản hồi < 2 giây | SWR caching, phân trang |
| Tính sẵn sàng | Hệ thống hoạt động ổn định | Error handling, retry logic |
| Bảo trì | Code dễ bảo trì | Cấu trúc MVC, component-based |
| Khả mở | Dễ thêm tính năng mới | Modular architecture |

---

# CHƯƠNG 3: CÔNG NGHỆ SỬ DỤNG (TECHNOLOGY STACK)

## 3.1. Tổng Quan Tech Stack

```
┌─────────────────────────────────────────────┐
│            TROHUB TECH STACK                │
├─────────────────────────────────────────────┤
│                                             │
│  🖥️ FRONTEND (Client)                      │
│  ├── React 18       (UI Library)            │
│  ├── Vite 5         (Build Tool)            │
│  ├── TailwindCSS 3  (Styling)              │
│  ├── Zustand 4      (State Management)      │
│  ├── SWR 2          (Data Fetching)         │
│  ├── React Router 6 (Routing)              │
│  ├── Radix UI       (UI Components)         │
│  ├── Leaflet        (Maps)                  │
│  ├── Chart.js       (Charts)               │
│  └── Axios          (HTTP Client)           │
│                                             │
│  ⚙️ BACKEND (Server)                       │
│  ├── Node.js        (Runtime)               │
│  ├── Express 4      (Web Framework)         │
│  ├── Sequelize 6    (ORM)                   │
│  ├── PostgreSQL     (Database)              │
│  ├── JWT            (Authentication)        │
│  ├── Bcrypt         (Password Hashing)      │
│  ├── Joi            (Input Validation)      │
│  ├── Nodemailer     (Email Service)         │
│  ├── Twilio         (SMS OTP)               │
│  └── Node-Cron      (Scheduled Tasks)       │
│                                             │
│  💳 PAYMENT GATEWAYS                       │
│  ├── VNPay          (Ngân hàng VN)          │
│  ├── MoMo           (Ví điện tử)            │
│  └── PayPal         (Quốc tế)              │
│                                             │
│  🌐 EXTERNAL APIs                          │
│  ├── Google OAuth   (Đăng nhập Google)      │
│  ├── OpenStreetMap  (Bản đồ)               │
│  ├── ExchangeRate   (Tỷ giá)               │
│  └── VN Admin API   (Tỉnh/Huyện/Xã)       │
│                                             │
└─────────────────────────────────────────────┘
```

## 3.2. Giải Thích Chi Tiết Từng Công Nghệ

### 3.2.1. React 18 — Thư Viện Giao Diện

**React là gì?** React là một thư viện JavaScript do Facebook tạo ra, dùng để xây dựng giao diện người dùng (UI). Thay vì viết HTML thuần, React cho phép bạn tạo **components** (các khối giao diện nhỏ) rồi ghép lại thành trang web.

**Ví dụ dễ hiểu:**
```
Trang web = Tập hợp nhiều mảnh ghép (components)

Trang Homepage = Header + SearchBar + PostList + Footer
                   ↓         ↓          ↓        ↓
               Component  Component  Component Component
```

**Tại sao dùng React?**
- **Component-based:** Chia nhỏ giao diện thành các khối, dễ quản lý
- **Virtual DOM:** Cập nhật giao diện nhanh, không load lại toàn trang
- **Cộng đồng lớn:** Nhiều thư viện hỗ trợ, dễ tìm giải pháp
- **React Hooks:** Quản lý state và lifecycle dễ dàng

**React trong TroHub:**
```jsx
// Đây là 1 React Component đơn giản
const App = () => {
  return (
    <main>           {/* <- Đây là JSX, giống HTML nhưng trong JavaScript */}
      <Outlet />     {/* <- Hiển thị trang con (child route) */}
      <Toaster />    {/* <- Component hiện thông báo toast */}
    </main>
  )
}
```

### 3.2.2. Vite 5 — Công Cụ Build

**Vite là gì?** Vite (đọc là "vít") là một build tool giúp chạy dự án React trong lúc phát triển (dev) và đóng gói (build) code để triển khai.

**So sánh dễ hiểu:**
- **Không có Vite:** Bạn viết code → phải tự config rất nhiều thứ → chạy chậm
- **Có Vite:** Bạn viết code → Vite tự lo hết → chạy cực nhanh (< 1 giây)

**Vite trong TroHub:**
```javascript
// vite.config.js — File cấu hình Vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],          // Plugin cho React
  resolve: {
    alias: { "@": "/src" },    // "@" = thư mục src (viết đường dẫn ngắn hơn)
  },
})
```

### 3.2.3. TailwindCSS 3 — Framework CSS

**TailwindCSS là gì?** Thay vì viết CSS riêng, TailwindCSS cho phép bạn viết CSS trực tiếp trong HTML/JSX bằng các **class có sẵn**.

**So sánh:**
```css
/* CSS truyền thống — phải tạo file CSS riêng */
.button {
  background-color: blue;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
```
```jsx
{/* TailwindCSS — viết trực tiếp trong JSX */}
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

### 3.2.4. Node.js & Express — Backend Server

**Node.js là gì?** Node.js cho phép chạy JavaScript ở phía server (máy chủ), không chỉ trên trình duyệt.

**Express là gì?** Express là một framework web cho Node.js, giúp tạo server và xử lý API dễ dàng.

**Ví dụ dễ hiểu:**
```
Browser (React) gửi yêu cầu → Express Server nhận → Xử lý → Trả kết quả
                                    ↓
Ví dụ: "Cho tôi danh sách phòng trọ ở Hà Nội"
                                    ↓
Server: Query database → Tìm phòng trọ ở HN → Trả về JSON
```

**Express trong TroHub:**
```javascript
// server/index.js — Điểm khởi đầu của server
const express = require("express")
const app = express()

// Cấu hình CORS — cho phép frontend gọi API
app.use(cors({
  origin: process.env.CLIENT_URL,     // Chỉ cho phép từ URL frontend
  methods: ["POST", "GET", "PATCH", "DELETE", "PUT"], // Các method được phép
}))

// Đọc dữ liệu JSON từ request body
app.use(express.json({ limit: "10mb" }))

// Khởi tạo tất cả routes (API endpoints)
initRoutes(app)

// Kết nối database
dbconn()

// Chạy server trên port 8888
app.listen(8888, () => {
  console.log("Server is running on port 8888")
})
```

### 3.2.5. PostgreSQL & Sequelize — Cơ Sở Dữ Liệu

**PostgreSQL là gì?** PostgreSQL (gọi tắt Postgres) là một hệ quản trị cơ sở dữ liệu (database) mã nguồn mở, mạnh mẽ và ổn định.

**Sequelize là gì?** Sequelize là một ORM (Object-Relational Mapping) — nó cho phép bạn tương tác với database bằng JavaScript thay vì viết câu SQL thuần.

**So sánh:**
```sql
-- SQL thuần (khó đọc, dễ sai)
SELECT * FROM "Users" WHERE "email" = 'test@gmail.com';
```
```javascript
// Sequelize (dễ đọc, an toàn, tự động escape)
const user = await db.User.findOne({ where: { email: 'test@gmail.com' } })
```

### 3.2.6. JWT — Xác Thực Người Dùng

**JWT (JSON Web Token) là gì?** JWT là một chuẩn mã hóa dùng để xác thực (authenticate) người dùng. Khi đăng nhập thành công, server tạo một "thẻ bài" (token) và gửi cho client. Client gửi kèm token này trong mỗi request để server biết "bạn là ai".

**Luồng hoạt động:**
```
1. User đăng nhập (email + password) ──→ Server
2. Server kiểm tra → Đúng → Tạo JWT Token
3. Server gửi Token về Client ←──────── Server
4. Client lưu Token vào localStorage
5. Mỗi lần gọi API, gửi kèm Token trong Header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
6. Server kiểm tra Token → Hợp lệ → Xử lý request
```

### 3.2.7. Zustand — Quản Lý State

**State là gì?** State là dữ liệu mà giao diện (UI) phụ thuộc vào. Khi state thay đổi → UI tự động cập nhật.

**Zustand là gì?** Zustand là thư viện quản lý state toàn cục (global state) cho React, nhỏ gọn và dễ dùng hơn Redux.

**Ví dụ trong TroHub:**
```javascript
// Zustand store — Lưu thông tin user đã đăng nhập
export const useMeStore = create(
  persist(
    (set) => ({
      token: null,      // JWT token
      me: null,          // Thông tin user
      setToken: (token) => set({ token }),    // Cập nhật token
      setMe: (me) => set({ me }),              // Cập nhật user info
      logout: () => set({ token: null, me: null }), // Đăng xuất
    }),
    { name: "trohub/me", storage: localStorage }  // Lưu vào localStorage
  )
)
```

### 3.2.8. SWR — Data Fetching

**SWR là gì?** SWR (stale-while-revalidate) là thư viện fetch dữ liệu từ API do Vercel tạo ra. Nó **cache dữ liệu** và tự động **refresh** khi cần.

**Cách hoạt động:**
```
1. Lần đầu: Gọi API → Hiện loading → Nhận data → Hiện data → Cache data
2. Lần sau: Hiện data từ cache NGAY LẬP TỨC → Gọi API refresh ngầm
   → Nếu data mới khác → Cập nhật UI
```

**Tại sao tốt hơn fetch/axios thường?**
- Người dùng thấy dữ liệu ngay lập tức (từ cache)
- Tự động retry khi lỗi
- Tự động refresh khi focus lại tab
- Giảm số lần gọi API không cần thiết

---

# CHƯƠNG 4: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

## 4.1. Kiến Trúc Tổng Thể

TroHub sử dụng kiến trúc **Client-Server** (hay còn gọi là kiến trúc 3 tầng / 3-Tier Architecture):

```
┌─────────────────────────────────────────────────────────────┐
│                    KIẾN TRÚC 3 TẦNG                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐                                │
│  │   TẦNG TRÌNH BÀY       │    React + Vite + TailwindCSS  │
│  │   (Presentation Tier)   │    Chạy trên browser           │
│  │   Port: 5173            │    Giao diện người dùng        │
│  └───────────┬─────────────┘                                │
│              │ HTTP/REST API (JSON)                          │
│              ▼                                               │
│  ┌─────────────────────────┐                                │
│  │   TẦNG XỬ LÝ           │    Node.js + Express            │
│  │   (Application Tier)    │    Xử lý logic nghiệp vụ      │
│  │   Port: 8888            │    API endpoints               │
│  └───────────┬─────────────┘                                │
│              │ Sequelize ORM (SQL queries)                   │
│              ▼                                               │
│  ┌─────────────────────────┐                                │
│  │   TẦNG DỮ LIỆU         │    PostgreSQL                   │
│  │   (Data Tier)           │    Lưu trữ dữ liệu            │
│  │   Port: 5432            │    12 bảng dữ liệu            │
│  └─────────────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4.2. Luồng Request-Response Chi Tiết

```
📱 User click "Tìm phòng trọ ở Hà Nội"
    │
    ▼
🌐 Browser (React Client — localhost:5173)
    │ 1. Component gọi SWR hook: useGetPublicPosts({ province: "Hà Nội" })
    │ 2. SWR kiểm tra cache → Chưa có → Gọi Axios
    │ 3. Axios gửi: GET /api/v1/post/public?province=Hà Nội
    │
    ▼ ────── HTTP Request ──────────────────────────
    │ Headers: { Authorization: "Bearer eyJhbG..." }
    │ Method: GET
    │ URL: http://localhost:8888/api/v1/post/public?province=Hà Nội
    │
    ▼
⚙️ Express Server (localhost:8888)
    │ 4. Route matching: app.use("/api/v1/post", postRoute)
    │ 5. Route handler: router.get("/public", getPostPublics)
    │
    ▼
📋 Controller: post.controller.js → getPostPublics()
    │ 6. Xây dựng WHERE clause từ query params
    │ 7. Thêm điều kiện: expiredDate >= NOW (chỉ lấy tin chưa hết hạn)
    │ 8. Thêm điều kiện: status = "Đã duyệt" (chỉ lấy tin đã duyệt)
    │
    ▼
🗃️ Sequelize ORM
    │ 9. Chuyển JavaScript object → SQL query:
    │    SELECT * FROM "Posts"
    │    WHERE "province" ILIKE '%Hà Nội%'
    │    AND "expiredDate" >= '2026-04-14'
    │    AND "status" = 'Đã duyệt'
    │    ORDER BY "priority" DESC
    │    LIMIT 5 OFFSET 0
    │
    ▼
🐘 PostgreSQL Database
    │ 10. Thực thi SQL → Trả về kết quả
    │
    ▼ ────── Ngược lại ──────────────────────────
    │
⚙️ Controller nhận kết quả → Format JSON response
    │
    ▼
🌐 Axios nhận response → SWR cache data → React re-render UI
    │
    ▼
📱 User thấy danh sách phòng trọ ở Hà Nội hiện lên
```

## 4.3. Mô Hình MVC (Model-View-Controller)

Backend TroHub theo mô hình **MVC** (biến thể):

```
┌─────────────────────────────────────────────────────┐
│                    MVC PATTERN                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📁 Models (server/models/)                         │
│  ├── Định nghĩa cấu trúc bảng database            │
│  ├── Quan hệ giữa các bảng                         │
│  └── Ví dụ: User.js, Post.js, Payment.js          │
│                                                     │
│  📁 Views (client/src/pages/)                       │
│  ├── Giao diện hiển thị cho người dùng             │
│  ├── React components                               │
│  └── Ví dụ: Homepage.jsx, Login.jsx                │
│                                                     │
│  📁 Controllers (server/controllers/)               │
│  ├── Xử lý logic nghiệp vụ                        │
│  ├── Nhận request → xử lý → trả response          │
│  └── Ví dụ: auth.controller.js, post.controller.js │
│                                                     │
│  📁 Routes (server/routes/)                         │
│  ├── Định tuyến URL → Controller                   │
│  ├── Áp dụng middleware                             │
│  └── Ví dụ: /api/v1/post → post.route.js          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 4.4. Sơ Đồ Tích Hợp Bên Ngoài

```
                    ┌──────────────┐
                    │   TROHUB     │
                    │   SERVER     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Google OAuth  │ │   VNPay API   │ │   MoMo API    │
│  (Đăng nhập)   │ │  (Thanh toán)  │ │  (Thanh toán)  │
└───────────────┘ └───────────────┘ └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Twilio (OTP)   │ │  Nodemailer   │ │  PayPal API   │
│  (SMS xác thực) │ │ (Email thông  │ │  (Thanh toán   │
│                │ │  báo & OTP)   │ │   quốc tế)    │
└───────────────┘ └───────────────┘ └───────────────┘
        │                  │
        ▼                  ▼
┌───────────────┐ ┌───────────────┐
│ OpenStreetMap  │ │  VN Admin     │
│  (Bản đồ vị    │ │  Division API │
│   trí phòng)   │ │  (Tỉnh/Huyện) │
└───────────────┘ └───────────────┘
```

---

# CHƯƠNG 5: CẤU TRÚC THƯ MỤC DỰ ÁN

## 5.1. Cấu Trúc Tổng Thể

```
trohub-main/
├── 📁 client/                    ← FRONTEND (React)
│   ├── 📁 src/                   ← Source code chính
│   │   ├── 📁 apis/              ← Gọi API đến server
│   │   │   ├── axios.js          ← Cấu hình Axios & endpoints
│   │   │   ├── auth.js           ← API đăng nhập/đăng ký
│   │   │   ├── user.js           ← API user (profile, deposit...)
│   │   │   ├── post.js           ← API tin đăng (CRUD)
│   │   │   ├── news.js           ← API tin tức
│   │   │   ├── chatbot.js        ← API chatbot
│   │   │   └── external.js       ← API bên ngoài (tỉnh/huyện, bản đồ)
│   │   │
│   │   ├── 📁 components/        ← Components tái sử dụng
│   │   │   ├── 📁 ui/            ← UI primitives (Button, Input, Dialog...)
│   │   │   ├── 📁 headers/       ← Header navigation
│   │   │   ├── 📁 sidebars/      ← Sidebar menu
│   │   │   ├── 📁 layouts/       ← Layout wrappers
│   │   │   ├── 📁 forms/         ← Form components
│   │   │   ├── 📁 maps/          ← Bản đồ Leaflet
│   │   │   ├── 📁 charts/        ← Biểu đồ Chart.js
│   │   │   ├── 📁 comments/      ← Phần bình luận
│   │   │   ├── 📁 ratings/       ← Phần đánh giá sao
│   │   │   ├── 📁 searchs/       ← Components tìm kiếm
│   │   │   ├── 📁 paginations/   ← Phân trang
│   │   │   ├── 📁 otp/           ← OTP input
│   │   │   └── 📁 navigations/   ← Navigation helpers
│   │   │
│   │   ├── 📁 hooks/             ← Custom React Hooks
│   │   │   ├── useDebounce.js    ← Debounce input (chống gọi API liên tục)
│   │   │   ├── usePagination.js  ← Tính toán phân trang
│   │   │   └── useCountDown.js   ← Đếm ngược (cho OTP)
│   │   │
│   │   ├── 📁 lib/               ← Tiện ích & hằng số
│   │   │   ├── constant.jsx      ← Menu, dropdown options, tỉnh/thành...
│   │   │   ├── pathnames.js      ← Định nghĩa URL paths
│   │   │   ├── utils.js          ← Hàm tiện ích (format tiền, thời gian...)
│   │   │   └── classnames.js     ← CSS class helper
│   │   │
│   │   ├── 📁 pages/             ← Các trang chính
│   │   │   ├── 📁 publics/       ← Trang công khai (ai cũng xem được)
│   │   │   │   ├── Homepage.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── SearchLayout.jsx
│   │   │   │   ├── DetailPost.jsx
│   │   │   │   ├── News.jsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 users/         ← Trang thành viên (cần đăng nhập)
│   │   │   │   ├── Personal.jsx
│   │   │   │   ├── ChangeEmail.jsx
│   │   │   │   ├── Wishlist.jsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 owners/        ← Trang chủ trọ (cần role owner)
│   │   │   │   ├── CreatePost.jsx
│   │   │   │   ├── ManagePost.jsx
│   │   │   │   ├── ManageOrder.jsx
│   │   │   │   ├── DepositVnpay.jsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── 📁 admin/         ← Trang admin (cần role admin)
│   │   │       ├── AdminGeneral.jsx
│   │   │       ├── ManageUser.jsx
│   │   │       ├── ManagePost.jsx
│   │   │       └── 📁 news/
│   │   │
│   │   ├── 📁 zustand/           ← Global State Management
│   │   │   ├── useMeStore.js     ← Store thông tin user đăng nhập
│   │   │   └── useSearchStore.js ← Store thông tin tìm kiếm
│   │   │
│   │   ├── App.jsx               ← Root component
│   │   ├── main.jsx              ← Entry point (điểm bắt đầu)
│   │   ├── routes.jsx            ← Định nghĩa routes (SPA routing)
│   │   └── index.css             ← Global CSS styles
│   │
│   ├── index.html                ← HTML template
│   ├── package.json              ← Dependencies & scripts
│   ├── vite.config.js            ← Vite configuration
│   └── tailwind.config.js        ← TailwindCSS configuration
│
├── 📁 server/                    ← BACKEND (Node.js + Express)
│   ├── index.js                  ← Entry point, khởi tạo server
│   │
│   ├── 📁 configs/               ← Cấu hình hệ thống
│   │   ├── dbconn.js             ← Kết nối PostgreSQL
│   │   └── sequelize.config.js   ← Cấu hình Sequelize CLI
│   │
│   ├── 📁 models/                ← Database Models (12 bảng)
│   │   ├── index.js              ← Auto-load tất cả models
│   │   ├── user.js               ← Bảng Users
│   │   ├── post.js               ← Bảng Posts (tin đăng)
│   │   ├── order.js              ← Bảng Orders (hóa đơn)
│   │   ├── payment.js            ← Bảng Payments (nạp tiền)
│   │   ├── comment.js            ← Bảng Comments
│   │   ├── rating.js             ← Bảng Ratings
│   │   ├── wishlist.js           ← Bảng Wishlists
│   │   ├── seenpost.js           ← Bảng SeenPosts
│   │   ├── news.js               ← Bảng News
│   │   ├── expired.js            ← Bảng Expired (gia hạn)
│   │   └── view.js               ← Bảng Views (thống kê)
│   │
│   ├── 📁 controllers/           ← Business Logic
│   │   ├── auth.controller.js    ← Đăng ký, đăng nhập
│   │   ├── user.controller.js    ← Profile, OTP, deposit, wishlist...
│   │   ├── post.controller.js    ← CRUD tin đăng, rating, comment
│   │   ├── payment.controller.js ← VNPay, MoMo payment
│   │   ├── order.controller.js   ← Hóa đơn, publish post
│   │   └── new.controller.js     ← CRUD tin tức
│   │
│   ├── 📁 routes/                ← API Route Definitions
│   │   ├── index.js              ← Mount all routes
│   │   ├── auth.route.js         ← /api/v1/auth/*
│   │   ├── user.route.js         ← /api/v1/user/*
│   │   ├── post.route.js         ← /api/v1/post/*
│   │   ├── payment.route.js      ← /api/v1/payment/*
│   │   ├── order.route.js        ← /api/v1/order/*
│   │   └── news.route.js         ← /api/v1/news/*
│   │
│   ├── 📁 middlewares/            ← Middleware Functions
│   │   ├── verify-token.midd.js  ← JWT authentication & role check
│   │   ├── validate-dto.midd.js  ← Joi input validation
│   │   └── error-handler.midd.js ← Centralized error handling
│   │
│   ├── 📁 utils/                  ← Helper Functions
│   │   ├── contants.js           ← Enum values (roles, statuses...)
│   │   ├── helpers.js            ← Email, password hash, sort...
│   │   ├── joi-schema.js         ← Reusable Joi validation schemas
│   │   ├── faker-data.js         ← Seed data generator
│   │   ├── mail-template.html    ← Email HTML template (OTP)
│   │   └── expired-template.html ← Email expired notification
│   │
│   ├── 📁 migrations/            ← Database Migration Files
│   │   ├── *-create-user.js
│   │   ├── *-create-post.js
│   │   └── ... (12 files)
│   │
│   ├── 📁 seeders/               ← Database Seed Data
│   ├── 📁 data/                   ← JSON data for seeding
│   ├── package.json              ← Dependencies & scripts
│   └── .env                      ← Environment variables
│
├── README.md                     ← Hướng dẫn cài đặt
└── .env                          ← Global environment variables
```

## 5.2. Giải Thích Vai Trò Mỗi Thư Mục

### Client (Frontend)

| Thư mục | Vai trò | Ví dụ ngắn |
|---------|---------|-------------|
| `apis/` | Định nghĩa các hàm gọi API đến server | `apiLoginWithEmail(data)` |
| `components/` | UI components tái sử dụng | Button, Input, Dialog, Map |
| `hooks/` | Custom hooks dùng chung | `useDebounce`, `usePagination` |
| `lib/` | Hằng số, pathnames, utility functions | `shortNumber(5000000)` → "5 triệu" |
| `pages/` | Các trang hiển thị (Page components) | Homepage, Login, CreatePost |
| `zustand/` | Global state stores | `useMeStore` (user info + token) |

### Server (Backend)

| Thư mục | Vai trò | Ví dụ ngắn |
|---------|---------|-------------|
| `configs/` | Cấu hình database connection | `dbconn.js`, `sequelize.config.js` |
| `models/` | Định nghĩa schema các bảng database | `User.init({ email: STRING...})` |
| `controllers/` | Xử lý logic nghiệp vụ | `getPostPublics()`, `loginWithEmail()` |
| `routes/` | Map URL → Controller function | `GET /post/public → getPostPublics` |
| `middlewares/` | Kiểm tra trước khi vào controller | `verifyToken`, `validateDto` |
| `utils/` | Hàm tiện ích, constants, email templates | `sendMail()`, `hassPassword()` |
| `migrations/` | Tạo/thay đổi cấu trúc bảng database | `CREATE TABLE Users(...)` |

---

> **Tiếp tục đọc Phần 2** để hiểu chi tiết về Backend: Database, API, Middleware, Payment, Email...
