# 📘 BÁO CÁO PHÂN TÍCH CHI TIẾT DỰ ÁN TROHUB

## Phần 2/4 — Backend Deep-Dive: Database, API, Middleware & Thanh Toán

---

# CHƯƠNG 6: CƠ SỞ DỮ LIỆU & MODELS

## 6.1. Tổng Quan Database

TroHub sử dụng **PostgreSQL** với **12 bảng dữ liệu**. Dưới đây là sơ đồ quan hệ (ERD):

```
┌─────────────────────────────────────────────────────────────┐
│                 SƠ ĐỒ QUAN HỆ CƠ SỞ DỮ LIỆU              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ 1    N ┌──────────┐ 1    N ┌──────────┐      │
│  │  Users   │───────→│  Posts    │───────→│ Comments  │      │
│  │          │        │          │        │          │      │
│  └──────┬───┘        └────┬─────┘        └──────────┘      │
│         │                 │                                 │
│    1    │            1    │                                 │
│    │    │            │    │    N ┌──────────┐               │
│    │    │            │    └─────→│ Ratings   │               │
│    │    │            │          └──────────┘               │
│    │    │            │                                      │
│    │    │    1    N   │    1 ┌──────────┐                    │
│    │    └───────────→│←────│ Orders    │                    │
│    │                 │     └──────────┘                    │
│    │                 │                                      │
│    │    1        N   │     N ┌──────────┐                    │
│    ├────────────────→│←─────│ Wishlists │                    │
│    │                 │      └──────────┘                    │
│    │                 │                                      │
│    │    1        N   │     N ┌──────────┐                    │
│    ├────────────────→│←─────│ SeenPosts │                    │
│    │                 │      └──────────┘                    │
│    │                 │                                      │
│    │    1        N   │     N ┌──────────┐                    │
│    ├────────────────→│←─────│ Expireds  │                    │
│    │                 │      └──────────┘                    │
│    │                                                        │
│    │    1        N ┌──────────┐                              │
│    ├──────────────→│ Payments  │                              │
│    │               └──────────┘                              │
│    │                                                        │
│    │    1        N ┌──────────┐                              │
│    └──────────────→│  News     │                              │
│                    └──────────┘                              │
│                                                             │
│               ┌──────────┐                                  │
│               │  Views    │  (Tracking bảng đơn)             │
│               └──────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 6.2. Chi Tiết Từng Bảng (Model)

### 6.2.1. Bảng Users — Người Dùng

**Mục đích:** Lưu thông tin tất cả người dùng trong hệ thống.

| Cột | Kiểu | Mô tả | Ví dụ |
|-----|------|-------|-------|
| `id` | INTEGER (PK) | Mã định danh, tự tăng | 1, 2, 3... |
| `email` | STRING | Email đăng ký | user@gmail.com |
| `emailVerified` | BOOLEAN | Email đã xác minh? | true/false |
| `phone` | STRING | Số điện thoại | 0901234567 |
| `phoneVerified` | BOOLEAN | SĐT đã xác minh? | true/false |
| `role` | ENUM | Vai trò | "Thành viên", "Chủ trọ", "Quản trị viên" |
| `fullname` | STRING | Họ tên | "Nguyễn Văn A" |
| `password` | STRING | Mật khẩu (đã mã hóa bcrypt) | $2a$10$xyz... |
| `avatar` | STRING | URL ảnh đại diện | https://...jpg |
| `balance` | INTEGER | Số dư tài khoản (VNĐ) | 500000 |
| `resetPwdToken` | STRING | Mã OTP reset password | "123456" |
| `resetPwdExpiry` | DATE | Thời hạn OTP | 2026-04-14T12:00:00 |
| `createdAt` | DATE | Ngày tạo | Tự động |
| `updatedAt` | DATE | Ngày cập nhật | Tự động |

**Code thực tế:**
```javascript
// server/models/user.js
User.init({
  email: DataTypes.STRING,
  emailVerified: DataTypes.BOOLEAN,
  phone: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM,
    values: ["Quản trị viên", "Chủ trọ", "Thành viên"],   // 3 vai trò
  },
  fullname: DataTypes.STRING,
  phoneVerified: DataTypes.BOOLEAN,
  password: DataTypes.STRING,        // Lưu dạng hash, KHÔNG BAO GIỜ lưu plain text
  avatar: DataTypes.STRING,
  balance: DataTypes.INTEGER,        // Số dư tài khoản
  resetPwdToken: DataTypes.STRING,   // OTP 6 số
  resetPwdExpiry: DataTypes.DATE,    // OTP hết hạn sau 5 phút
}, { sequelize, modelName: "User" })

// Quan hệ: 1 User có nhiều Wishlist
User.hasMany(models.Wishlist, { foreignKey: "idUser", as: "rWishlist" })
```

> [!IMPORTANT]
> **Bảo mật quan trọng:** Password KHÔNG BAO GIỜ được lưu dạng text thường. Nó luôn được mã hóa bằng bcrypt trước khi lưu vào database. Khi đăng nhập, hệ thống so sánh hash chứ KHÔNG so sánh mật khẩu thật.

### 6.2.2. Bảng Posts — Tin Đăng

**Mục đích:** Lưu thông tin các tin đăng cho thuê phòng trọ/nhà/căn hộ.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INTEGER (PK) | Mã tin đăng |
| `title` | STRING | Tiêu đề tin |
| `address` | STRING | Địa chỉ đầy đủ |
| `ward` | STRING | Phường/Xã |
| `district` | STRING | Quận/Huyện |
| `province` | STRING | Tỉnh/Thành |
| `addressBonus` | STRING | Địa chỉ bổ sung |
| `price` | BIGINT | Giá thuê (VNĐ/tháng) |
| `size` | INTEGER | Diện tích (m²) |
| `priority` | INTEGER | Mức ưu tiên (0-5) |
| `bedroom` | INTEGER | Số phòng ngủ |
| `bathroom` | INTEGER | Số phòng tắm |
| `views` | INTEGER | Lượt xem |
| `description` | TEXT | Mô tả chi tiết |
| `gender` | ENUM | Giới tính cho thuê |
| `postType` | ENUM | Loại tin đăng |
| `idUser` | INTEGER (FK) | ID chủ trọ |
| `expiredDate` | DATE | Ngày hết hạn |
| `verified` | BOOLEAN | Đã xác minh? |
| `status` | ENUM | Trạng thái |
| `roomStatus` | ENUM | Tình trạng phòng |
| `media` | TEXT (JSON) | Ảnh/video |
| `convenient` | TEXT (JSON) | Tiện ích |

**Điểm đáng chú ý — Custom Getter/Setter:**
```javascript
// Cột "media" và "convenient" lưu dạng JSON string trong database
// nhưng khi đọc ra tự động parse thành array
media: {
  type: DataTypes.TEXT,
  get() {
    const raw = this.getDataValue("media")
    return raw ? JSON.parse(raw) : []       // DB lưu: '["url1","url2"]'
  },                                         // JS nhận: ["url1", "url2"]
  set(value) {
    this.setDataValue("media", JSON.stringify(value))  // JS gửi: ["url1"]
  },                                                     // DB lưu: '["url1"]'
},
```

> [!TIP]
> **Tại sao dùng TEXT thay vì ARRAY?** PostgreSQL hỗ trợ kiểu ARRAY, nhưng Sequelize xử lý JSON trong TEXT ổn định hơn khi chạy trên nhiều database khác nhau. Đây là cách tiếp cận "portable" (dễ chuyển đổi database).

**Các ENUM values:**
```javascript
// server/utils/contants.js
statuses:    ["Đã duyệt", "Đang chờ duyệt", "Từ chối"]
roomStatuses: ["Còn trống", "Đã thuê"]
postTypes:   ["Cho thuê phòng trọ", "Nhà cho thuê", "Cho thuê căn hộ"]
genders:     ["Tất cả", "Nam", "Nữ", "Khác"]
```

### 6.2.3. Bảng Orders — Hóa Đơn Đăng Tin

**Mục đích:** Mỗi khi chủ trọ tạo tin mới, một Order được tạo. Admin duyệt tin → chủ trọ thanh toán → tin được công khai.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INTEGER (PK) | Mã hóa đơn |
| `idPost` | INTEGER (FK) | Tin đăng liên quan |
| `idUser` | INTEGER (FK) | Người tạo |
| `orderedDays` | INTEGER | Số ngày đăng |
| `total` | INTEGER | Tổng tiền |
| `idInvoice` | STRING | Mã hóa đơn unique |
| `status` | ENUM | "Thành công", "Đang chờ", "Thất bại" |
| `confirmedDate` | DATE | Ngày admin duyệt |
| `expiredDate` | DATE | Ngày hết hạn |

### 6.2.4. Bảng Payments — Nạp Tiền

**Mục đích:** Ghi lại lịch sử nạp tiền vào tài khoản.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `idUser` | INTEGER (FK) | Người nạp |
| `idInvoice` | STRING | Mã giao dịch |
| `method` | ENUM | "Paypal", "VNPay", "MoMo" |
| `amount` | BIGINT | Số tiền nạp |
| `status` | ENUM | "Thành công", "Đang chờ", "Thất bại" |

### 6.2.5. Bảng Comments — Bình Luận

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `idUser` | INTEGER (FK) | Người bình luận |
| `idPost` | INTEGER (FK) | Tin đăng được bình luận |
| `idParent` | INTEGER | Bình luận cha (reply) |
| `content` | TEXT | Nội dung bình luận |

> [!NOTE]
> Cột `idParent` cho phép tạo **nested comments** (bình luận lồng nhau, reply). Nếu `idParent = null` thì đó là bình luận gốc. Nếu có giá trị thì đó là reply cho bình luận có id tương ứng.

### 6.2.6. Bảng Ratings — Đánh Giá Sao

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `idUser` | INTEGER (FK) | Người đánh giá |
| `idPost` | INTEGER (FK) | Tin đăng được đánh giá |
| `star` | INTEGER | Số sao (1-5) |

### 6.2.7. Các Bảng Phụ Trợ

**Wishlist** (Tin yêu thích): `{ idUser, idPost }`
**SeenPost** (Tin đã xem): `{ idUser, idPost }`
**Expired** (Gia hạn tin): `{ idPost, idUser, days, total, status, idInvoice }`
**News** (Tin tức): `{ title, avatar, content, idUser }`
**View** (Thống kê truy cập): `{ anonymous, registed }` — chỉ có 1 record

## 6.3. Quan Hệ Giữa Các Bảng (Associations)

```javascript
// User → Post: 1 User tạo nhiều Posts
Post.belongsTo(User, { foreignKey: "idUser", as: "postedBy" })

// Post → Order: 1 Post có 1 Order
Post.hasOne(Order, { foreignKey: "idPost", as: "rOrder" })

// Post → Comment: 1 Post có nhiều Comments
Comment.belongsTo(User, { foreignKey: "idUser", as: "commentator" })

// Post → Rating: 1 Post có nhiều Ratings
Rating.belongsTo(User, { foreignKey: "idUser", as: "rUser" })

// User → Wishlist: 1 User có nhiều Wishlists
User.hasMany(Wishlist, { foreignKey: "idUser", as: "rWishlist" })
Wishlist.belongsTo(Post, { foreignKey: "idPost", as: "rPost" })

// Expired
Expired.belongsTo(Post, { foreignKey: "idPost", as: "rPost" })
Expired.belongsTo(User, { foreignKey: "idUser", as: "rUser" })

// Order
Order.belongsTo(Post, { foreignKey: "idPost", as: "rPost" })
Order.belongsTo(User, { foreignKey: "idUser", as: "rUser" })

// News
New.belongsTo(User, { foreignKey: "idUser", as: "postedBy" })
```

## 6.4. Database Migration System

Migrations là cách TroHub quản lý thay đổi cấu trúc database theo thời gian:

```
20240913072641-create-user.js       ← Tạo bảng Users
20240913072710-create-post.js       ← Tạo bảng Posts
20240913072759-create-wishlist.js   ← Tạo bảng Wishlists
20240913072832-create-seen-post.js  ← Tạo bảng SeenPosts
20240913072851-create-rating.js     ← Tạo bảng Ratings
20240913072903-create-comment.js    ← Tạo bảng Comments
20240913073041-create-payment.js    ← Tạo bảng Payments
20240913073336-create-expired.js    ← Tạo bảng Expireds
20240913073355-create-news.js       ← Tạo bảng News
20241014142821-create-view.js       ← Tạo bảng Views
20241103031937-create-order.js      ← Tạo bảng Orders
20260408101000-add-momo-payment.js  ← Thêm MoMo vào payment method
```

**Chạy migration:** `yarn migrate` (tạo tất cả bảng)
**Chạy seeder:** `yarn seed` (insert dữ liệu mẫu)
**Chạy cả hai:** `yarn mockup`

---

# CHƯƠNG 7: API ROUTES & CONTROLLERS

## 7.1. Tổng Quan API Endpoints

Tất cả API đều có prefix: `/api/v1/`

### 7.1.1. Auth Routes (`/api/v1/auth/`)

| Method | URL | Mô tả | Auth? |
|--------|-----|-------|-------|
| POST | `/login-email` | Đăng nhập bằng email | ❌ |
| POST | `/login-phone` | Đăng nhập bằng SĐT | ❌ |
| POST | `/register-email` | Đăng ký bằng email | ❌ |
| POST | `/register-phone` | Đăng ký bằng SĐT | ❌ |
| POST | `/google` | Đăng nhập bằng Google | ❌ |

### 7.1.2. User Routes (`/api/v1/user/`)

| Method | URL | Mô tả | Auth? | Role? |
|--------|-----|-------|-------|-------|
| GET | `/me` | Lấy thông tin bản thân | ✅ | — |
| PUT | `/me` | Cập nhật profile | ✅ | — |
| POST | `/send-otp` | Gửi OTP SMS | ✅ | — |
| POST | `/verify-otp` | Xác minh OTP SĐT | ✅ | — |
| POST | `/send-mail` | Gửi OTP email | ✅ | — |
| POST | `/verify-mail` | Xác minh email | ✅ | — |
| POST | `/deposit` | Nạp tiền PayPal | ✅ | — |
| PUT | `/wishlist` | Toggle yêu thích | ✅ | — |
| GET | `/wls` | DS tin yêu thích | ✅ | — |
| GET | `/seen-posts` | DS tin đã xem | ✅ | — |
| POST | `/expire-post` | Gia hạn tin | ✅ | — |
| PUT | `/views` | Cập nhật view count | ⭕ | — |
| PUT | `/upgrade-owner` | Nâng cấp → chủ trọ | ✅ | — |
| GET | `/payment-history` | Lịch sử nạp tiền | ✅ | — |
| GET | `/expired-history` | Lịch sử gia hạn | ✅ | — |
| POST | `/reset-password-required` | Yêu cầu reset MK | ❌ | — |
| POST | `/reset-password-verify` | Xác nhận reset MK | ❌ | — |
| GET | `/admin` | DS users (admin) | ✅ | Admin |
| PUT | `/admin/:id` | Cập nhật role user | ✅ | Admin |
| DELETE | `/admin` | Xóa users | ✅ | Admin |
| GET | `/dashboard` | Dashboard data | ✅ | Admin |

*(✅ = cần token, ❌ = không cần, ⭕ = optional)*

### 7.1.3. Post Routes (`/api/v1/post/`)

| Method | URL | Mô tả | Auth? | Role? |
|--------|-----|-------|-------|-------|
| POST | `/new` | Tạo tin đăng mới | ✅ | Owner |
| GET | `/user` | DS tin đăng của tôi | ✅ | — |
| GET | `/public` | DS tin đăng công khai | ❌ | — |
| PUT | `/update/:id` | Cập nhật tin đăng | ✅ | Owner |
| DELETE | `/remove` | Xóa tin đăng | ✅ | Owner |
| GET | `/one/:id` | Chi tiết 1 tin đăng | ⭕ | — |
| POST | `/rating` | Đánh giá sao | ✅ | — |
| POST | `/comment-new` | Bình luận | ✅ | — |
| PUT | `/update-status/:id` | Duyệt/từ chối tin | ✅ | Admin |
| GET | `/admin/posts` | DS tin (admin) | ✅ | Admin |
| GET | `/admin/orders` | DS hóa đơn (admin) | ✅ | Admin |
| DELETE | `/remove-by-admin/:id` | Xóa tin (admin) | ✅ | Admin |

### 7.1.4. Payment Routes (`/api/v1/payment/`)

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/deposit` | Tạo link thanh toán VNPay |
| GET | `/vnpay-return` | VNPay callback |
| POST | `/momo/create` | Tạo link thanh toán MoMo |
| GET | `/momo/return` | MoMo redirect callback |
| POST | `/momo/ipn` | MoMo IPN webhook |

### 7.1.5. Order Routes (`/api/v1/order/`)

| Method | URL | Mô tả | Role? |
|--------|-----|-------|-------|
| GET | `/all` | DS hóa đơn của tôi | Owner |
| PUT | `/public-post/:id` | Công khai tin | Owner |
| DELETE | `/one/:id` | Xóa hóa đơn | Owner |

### 7.1.6. News Routes (`/api/v1/news/`)

| Method | URL | Mô tả | Role? |
|--------|-----|-------|-------|
| POST | `/new` | Tạo tin tức | Admin |
| GET | `/admin` | DS tin tức (admin) | Admin |
| GET | `/public` | DS tin tức (public) | — |
| GET | `/one/:id` | Chi tiết 1 tin tức | — |
| PUT | `/update/:id` | Cập nhật tin tức | Admin |
| DELETE | `/delete` | Xóa tin tức | Admin |

## 7.2. Chi Tiết Controller Logic

### 7.2.1. Auth Controller — Luồng Đăng Nhập

```javascript
// Đăng nhập bằng Email — Giải thích từng bước
loginWithEmail: async (req, res) => {
  // Bước 1: Lấy email và password từ request body
  const { password, email } = req.body

  // Bước 2: Tìm user trong database bằng email
  const alreadyUser = await db.User.findOne({ where: { email }, raw: true })

  // Bước 3: Nếu không tìm thấy → email chưa đăng ký
  if (!alreadyUser) return res.json({
    success: false,
    msg: "Email chưa được đăng ký!"
  })

  // Bước 4: So sánh password nhập vào với hash trong database
  // bcrypt.compareSync("123456", "$2a$10$xyz...") → true/false
  const isCorrentPassword = bcrypt.compareSync(password, alreadyUser.password)

  // Bước 5: Nếu sai mật khẩu
  if (!isCorrentPassword) return res.json({
    success: false,
    msg: "Mật khẩu không chính xác!"
  })

  // Bước 6: Tạo JWT Token (có hiệu lực 7 ngày)
  // Token chứa: { uid: 123 } → Sau này server biết "user ID 123 đang gọi API"
  const token = jwt.sign(
    { uid: alreadyUser.id },        // Payload (dữ liệu trong token)
    process.env.JWT_SECRET,          // Secret key (dùng để ký)
    { expiresIn: "7d" }             // Hết hạn sau 7 ngày
  )

  // Bước 7: Trả token về client
  return res.json({
    success: true,
    accessToken: token,
    msg: "Đăng nhập thành công"
  })
}
```

### 7.2.2. Post Controller — Tạo Tin Đăng

```javascript
createNewPost: async (req, res) => {
  const { uid } = req.user    // Lấy user ID từ JWT token
  const { orderedDays = 3, total, ...payload } = req.body
  payload.idUser = uid         // Gán người đăng = user hiện tại

  // 1. Tạo tin đăng trong database
  const response = await db.Post.create(payload)

  // 2. Nếu tạo thành công → Tạo Order (hóa đơn)
  if (!!response) {
    const orderData = {
      idPost: response.id,
      idUser: uid,
      total,
      orderedDays,
      idInvoice: randomstring.generate(8).toUpperCase(), // VD: "A3B5C7D9"
      status: "Đang chờ",    // Trạng thái ban đầu = đang chờ duyệt
    }
    await db.Order.create(orderData)
  }

  return res.json({
    success: !!response,
    msg: !!response ? "Tạo tin đăng thành công." : "Tạo tin đăng không thành công."
  })
}
```

### 7.2.3. Post Controller — Tìm Kiếm Tin Đăng Công Khai

```javascript
getPostPublics: async (req, res) => {
  // Lấy tất cả filter từ query params
  const {
    limit = 5, page = 1,
    title, province, district, ward,
    price, size, convenient, status,
    ...rest
  } = req.query

  const whereClause = rest

  // CHỈ lấy tin chưa hết hạn
  whereClause.expiredDate = { [Op.gte]: Date.now() }

  // CHỈ lấy tin đã duyệt (trừ khi filter khác)
  if (status) whereClause.status = status
  else whereClause.status = ["Đã duyệt"]

  // Sắp xếp theo mức ưu tiên (Kim cương lên đầu)
  const sortBy = [["priority", "DESC"]]

  // Phân trang
  const offset = (parseInt(page) - 1) * parseInt(limit)

  // Filter theo tiện ích
  if (convenient && typeof convenient === "object") {
    whereClause.convenient = {
      [Op.or]: convenient.map(el => ({ [Op.iLike]: `%${el}%` }))
    }
  }

  // Filter theo khoảng giá
  if (price && price !== "ALL") {
    const priceArray = JSON.parse(price)
    if (typeof priceArray[0] === "string") {
      whereClause.price = { [Op[priceArray[0]]]: priceArray[1] }  // gt/lt
    } else {
      whereClause.price = { [Op.between]: priceArray }  // [min, max]
    }
  }

  // Filter theo tên, địa chỉ (case-insensitive)
  if (title) whereClause.title = { [Op.iLike]: `%${title}%` }
  if (province) whereClause.province = { [Op.iLike]: `%${province}%` }

  // Query database
  const posts = await db.Post.findAll({
    where: whereClause,
    limit, offset,
    order: sortBy
  })
  const count = await db.Post.count({ where: whereClause })

  return res.json({
    success: true,
    posts,
    pagination: {
      limit, page, count,
      totalPages: Math.ceil(count / limit)
    }
  })
}
```

### 7.2.4. Đánh Giá (Rating) — Tính Trung Bình Sao

```javascript
ratingPost: async (req, res) => {
  const { star, idPost } = req.body
  const { uid } = req.user

  // Kiểm tra đã đánh giá chưa
  const alreadyRating = await db.Rating.findOne({ where: { idUser: uid, idPost } })

  if (alreadyRating) {
    // Đã đánh giá → CẬP NHẬT số sao
    await db.Rating.update({ star }, { where: { id: alreadyRating.id } })
  } else {
    // Chưa đánh giá → TẠO MỚI
    await db.Rating.create({ idUser: uid, idPost, star })
  }

  // Tính trung bình sao MỚI từ TẤT CẢ đánh giá
  const response = await db.Rating.findOne({
    where: { idPost },
    attributes: [[Sequelize.fn("avg", Sequelize.col("star")), "averageStar"]],
    raw: true,
  })

  const averageStar = Math.round(response.averageStar * 10) / 10  // Làm tròn 1 chữ số

  // Cập nhật averageStar vào bảng Post
  await db.Post.update({ averageStar }, { where: { id: idPost } })
}
```

---

# CHƯƠNG 8: MIDDLEWARE & BẢO MẬT

## 8.1. Middleware Là Gì?

Middleware giống như **bảo vệ cổng**. Trước khi request đến Controller, nó phải đi qua các middleware. Mỗi middleware kiểm tra 1 điều kiện.

```
Request → [Middleware 1] → [Middleware 2] → [Middleware 3] → Controller
             ↓                  ↓                 ↓
         Kiểm tra Token    Kiểm tra Role    Validate Data
         (Đã đăng nhập?)   (Có quyền?)      (Data hợp lệ?)
```

## 8.2. Verify Token Middleware

```javascript
// Kiểm tra JWT Token — Bảo vệ các route cần đăng nhập
const verifyToken = async (req, res, next) => {
  // 1. Kiểm tra header Authorization có chứa "Bearer xxx..." không
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    const token = req.headers.authorization?.split(" ")[1]  // Lấy token

    // 2. Giải mã token bằng secret key
    jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        // Token hết hạn hoặc không hợp lệ
        return res.status(401).json({
          success: false,
          msg: "Hết phiên, yêu cầu đăng nhập."
        })
      }
      // 3. Token hợp lệ → gắn thông tin user vào request
      req.user = decode  // { uid: 123, iat: ..., exp: ... }
      next()             // Cho đi tiếp vào controller
    })
  } else {
    // Không có token
    return res.status(401).json({
      success: false,
      msg: "Hết phiên, yêu cầu đăng nhập."
    })
  }
}
```

## 8.3. Role-Based Access Control

```javascript
// Kiểm tra quyền Admin
const isAdmin = async (req, res, next) => {
  const { uid } = req.user
  const user = await db.User.findByPk(uid)

  if (!user || user.role !== "Quản trị viên")
    return res.json({ success: false, msg: "Không có quyền truy cập" })

  next()  // Là admin → cho đi tiếp
}

// Kiểm tra quyền Chủ trọ
const isOwner = async (req, res, next) => {
  const { uid } = req.user
  const user = await db.User.findByPk(uid)

  if (!user || user.role !== "Chủ trọ")
    return res.json({ success: false, msg: "Không có quyền truy cập" })

  next()  // Là chủ trọ → cho đi tiếp
}
```

**Ví dụ sử dụng:**
```javascript
// Chỉ Owner mới tạo được tin đăng
router.post("/new", verifyToken, isOwner, validateDto(...), ctrls.createNewPost)
//                     ↑            ↑           ↑               ↑
//                  Check token  Check role  Check input    Business logic
```

## 8.4. Validate DTO Middleware

DTO = Data Transfer Object. Middleware này kiểm tra dữ liệu đầu vào có hợp lệ không.

```javascript
const validateDto = (schema) => (req, res, next) => {
  // Joi validate request body theo schema
  const { error } = schema.validate(req.body)

  if (error) {
    // Có lỗi → trả về lỗi, KHÔNG cho vào controller
    const message = error.details[0].message?.replaceAll(`\"`, "")
    throwErrorWithStatus(401, message, res, next)
  }

  next()  // Hợp lệ → cho đi tiếp
}
```

**Ví dụ Joi Schema:**
```javascript
// Khi đăng nhập, bắt buộc phải có email và password
validateDto(joi.object({
  email: joi.string().required().email(),  // Bắt buộc, phải là email hợp lệ
  password: joi.string().required(),        // Bắt buộc
}))
```

## 8.5. Error Handler Middleware

```javascript
// Xử lý lỗi tập trung
const errHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  return res.status(statusCode).json({
    success: false,
    msg: error?.message
  })
}

// Xử lý route không tồn tại (404)
const badRequestException = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found.`)
  res.status(403)
  next(error)
}
```

---

# CHƯƠNG 9: TÍCH HỢP THANH TOÁN

## 9.1. Tổng Quan 3 Cổng Thanh Toán

```
┌─────────────────────────────────────────────────┐
│           HỆ THỐNG THANH TOÁN TROHUB           │
├─────────────────────────────────────────────────┤
│                                                 │
│  💳 VNPay (Ngân hàng Việt Nam)                 │
│  ├── Thanh toán qua thẻ ATM nội địa           │
│  ├── HMAC-SHA512 signature                     │
│  └── Redirect flow (server redirect)           │
│                                                 │
│  📱 MoMo (Ví điện tử)                         │
│  ├── Thanh toán qua ví MoMo                   │
│  ├── HMAC-SHA256 signature                     │
│  ├── Redirect + IPN callback                   │
│  └── Idempotent processing (chống duplicate)   │
│                                                 │
│  🌍 PayPal (Quốc tế)                          │
│  ├── Client-side payment (React SDK)           │
│  └── Server confirms sau khi client pay        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 9.2. VNPay Payment Flow

```
User click "Nạp tiền VNPay"
    │
    ▼
1. Client gửi: POST /api/v1/payment/deposit { amount: 500000 }
    │
    ▼
2. Server tạo VNPay payment URL:
   - Thêm các tham số: vnp_Amount, vnp_OrderInfo, vnp_TxnRef...
   - Sắp xếp params theo alphabet (sortObject)
   - Ký HMAC-SHA512 với vnp_hashSecret
   - Trả về URL đầy đủ cho client
    │
    ▼
3. Client redirect user đến VNPay gateway
   - User nhập thông tin thẻ ATM
   - VNPay xử lý thanh toán
    │
    ▼
4. VNPay redirect về: GET /api/v1/payment/vnpay-return?vnp_TxnRef=...
    │
    ▼
5. Server xử lý callback:
   - Xác minh chữ ký (signature) → Đảm bảo data không bị sửa
   - Kiểm tra trạng thái giao dịch
   - Cộng tiền vào tài khoản user (db.User.increment)
   - Tạo Payment record
   - Redirect user đến trang thông báo kết quả
```

**Code tạo VNPay URL:**
```javascript
const createPaymentUrl = ({ amount, ipAddr, orderInfo }) => {
  let vnp_Params = {}
  vnp_Params["vnp_Version"] = "2.1.0"
  vnp_Params["vnp_Command"] = "pay"
  vnp_Params["vnp_TmnCode"] = vnp_TmnCode      // Mã website TroHub
  vnp_Params["vnp_Amount"] = amount * 100        // VNPay tính bằng đồng
  vnp_Params["vnp_CurrCode"] = "VND"
  vnp_Params["vnp_TxnRef"] = orderId             // Mã giao dịch duy nhất
  vnp_Params["vnp_OrderInfo"] = orderInfo
  vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl    // URL callback

  // Sắp xếp params và ký HMAC-SHA512
  vnp_Params = sortObject(vnp_Params)
  const signData = querystring.stringify(vnp_Params, { encode: false })
  const signed = crypto.createHmac("sha512", vnp_hashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex")

  vnp_Params["vnp_SecureHash"] = signed
  return `${vnp_Url}?${querystring.stringify(vnp_Params)}`
}
```

## 9.3. MoMo Payment Flow

MoMo flow phức tạp hơn vì có **2 callback**: redirect và IPN (Instant Payment Notification).

```
User click "Nạp tiền MoMo"
    │
    ▼
1. Client: POST /api/v1/payment/momo/create { amount: 50000 }
    │
    ▼
2. Server tạo MoMo payment request:
   - Tạo rawSignature: accessKey=...&amount=...&orderId=...
   - Ký HMAC-SHA256
   - Gửi HTTP POST đến MoMo API endpoint
   - Nhận payUrl từ MoMo
   - Trả payUrl cho client
    │
    ▼
3. Client redirect user đến MoMo
   - User xác nhận thanh toán trên MoMo
    │
    ▼
4. MoMo gọi 2 callbacks:
   ┌──────────────────────────────────────────┐
   │ Redirect: GET /payment/momo/return       │ ← User thấy kết quả
   │ IPN:      POST /payment/momo/ipn         │ ← Server-to-server
   └──────────────────────────────────────────┘
    │
    ▼
5. Server xử lý (processMomoTopup):
   - Xác minh chữ ký MoMo
   - Dùng database TRANSACTION để cộng tiền 1 LẦN DUY NHẤT
   - Kiểm tra existedPayment (chống duplicate)
   - Tạo Payment record
```

> [!WARNING]
> **Chống duplicate payment:** Vì MoMo gọi 2 callback (redirect + IPN), server có thể nhận 2 request cùng lúc. Code sử dụng **database transaction + lock** để đảm bảo chỉ cộng tiền **đúng 1 lần**:
> ```javascript
> await db.sequelize.transaction(async (transaction) => {
>   const existed = await db.Payment.findOne({
>     where: { idInvoice: orderId, method: "MoMo" },
>     transaction,
>     lock: transaction.LOCK.UPDATE,  // LOCK row để thread khác chờ
>   })
>   if (existed) return  // Đã xử lý rồi → bỏ qua
>   // Cộng tiền và tạo record...
> })
> ```

---

# CHƯƠNG 10: HỆ THỐNG EMAIL & CRON JOB

## 10.1. Email System (Nodemailer)

TroHub gửi email qua SMTP cho 3 mục đích:
1. **OTP xác minh email** — Gửi mã 6 số
2. **Reset mật khẩu** — Gửi mã OTP
3. **Thông báo tin đăng** — Duyệt/từ chối/hết hạn

```javascript
// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,    // mail server (smtp.gmail.com)
  port: 465,                       // SMTP port (SSL)
  secure: true,
  auth: {
    user: process.env.SMTP_USER,   // Email gửi đi
    pass: process.env.SMTP_PASS,   // App password
  },
})

// Gửi email
await transporter.sendMail({
  from: '"Trohub" <trohub@gmail.com>',  // Người gửi
  to: "user@gmail.com",                   // Người nhận
  subject: "Your OTP Code",               // Tiêu đề
  html: emailContent,                      // Nội dung HTML
})
```

## 10.2. Email Templates

TroHub có 2 HTML template cho email:
- `mail-template.html` — Template OTP (chứa placeholder `{{OTP}}`)
- `expired-template.html` — Template thông báo hết hạn (chứa `{{fullname}}`, `{{title}}`, `{{expiredDate}}`)

```javascript
// Đọc template và thay thế placeholder
const readHtmlTemplate = (otp) => {
  const templatePath = path.join(__dirname, "mail-template.html")
  let html = fs.readFileSync(templatePath, "utf8")
  html = html.replace("{{OTP}}", otp)  // Thay {{OTP}} bằng mã thực
  return html
}
```

## 10.3. Cron Job — Quét Tin Hết Hạn

TroHub chạy một **cron job** (tác vụ tự động theo lịch) mỗi ngày lúc 20:16 để kiểm tra và thông báo tin đăng hết hạn:

```javascript
// Chạy lúc 20:16 mỗi ngày
cron.schedule("16 20 * * *", async () => {
  // 1. Tìm tất cả tin đăng đã hết hạn
  const expiredPosts = await db.Post.findAll({
    where: { expiredDate: { [Op.lt]: Date.now() } },   // expiredDate < NOW
    include: [{ model: db.User, as: "postedBy", attributes: ["fullname", "email"] }],
  })

  // 2. Gửi email thông báo cho chủ trọ
  for (let post of expiredPosts) {
    if (post.postedBy?.email) {
      const emailContent = readHtmlTemplateExpired({
        expiredDate: moment(post.expiredDate).format("DD/MM/YYYY"),
        title: post.title,
        fullname: post.postedBy?.fullname,
      })

      await sendMail({
        from: '"Trohub" <trohub@gmail.com>',
        to: post.postedBy.email,
        subject: "Thông báo",
        html: emailContent,
      })
    }
  }
})
```

**Cron expression: `"16 20 * * *"`**
```
 ┌───────────── phút (16)
 │ ┌─────────── giờ (20 = 8 PM)
 │ │ ┌───────── ngày trong tháng (* = mọi ngày)
 │ │ │ ┌─────── tháng (* = mọi tháng)
 │ │ │ │ ┌───── ngày trong tuần (* = mọi ngày)
 │ │ │ │ │
16 20 * * *   →  Chạy lúc 20:16 mỗi ngày
```

---

> **Tiếp tục đọc Phần 3** để hiểu chi tiết về Frontend: React, State, Routing, Pages, Components...
