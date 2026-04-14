# 📘 BÁO CÁO PHÂN TÍCH CHI TIẾT DỰ ÁN TROHUB

## Phần 3/4 — Frontend Deep-Dive: React, State, Routing & Components

---

# CHƯƠNG 11: REACT & VITE SETUP

## 11.1. Entry Point — Điểm Bắt Đầu

Khi user truy cập `http://localhost:5173`, trình duyệt tải file `index.html`:

```html
<!-- client/index.html -->
<body>
  <div id="root"></div>          <!-- React sẽ render vào đây -->
  <script type="module" src="/src/main.jsx"></script>  <!-- Entry point -->
</body>
```

Tiếp theo, `main.jsx` được thực thi:

```jsx
// client/src/main.jsx — ĐIỂM BẮT ĐẦU CỦA ỨNG DỤNG
import { createRoot } from "react-dom/client"      // React DOM
import { createBrowserRouter, RouterProvider } from "react-router-dom"  // Router
import { GoogleOAuthProvider } from "@react-oauth/google"  // Google OAuth
import routes from "./routes"       // Cấu hình routing
import "./index.css"                // CSS toàn cục

const router = createBrowserRouter(routes)  // Tạo router từ cấu hình

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_GG_ID}>
    {/* ↑ Bọc toàn bộ app trong GoogleOAuthProvider để dùng Google Login */}
    <RouterProvider router={router} />
    {/* ↑ RouterProvider quản lý toàn bộ navigation */}
  </GoogleOAuthProvider>
)
```

**Quy trình khởi động:**
```
1. Browser load index.html
2. Browser load main.jsx (Vite xử lý)
3. React render <App /> component vào div#root
4. GoogleOAuthProvider khởi tạo Google SDK
5. RouterProvider khởi tạo routing
6. User thấy giao diện Homepage
```

## 11.2. App Component — Root Component

```jsx
// client/src/App.jsx
const App = () => {
  const { getMe, token } = useMeStore()  // Lấy getMe function và token từ Zustand

  // Chạy 1 lần khi app khởi động: Cập nhật view count
  useEffect(() => {
    const updateViews = async () => {
      await apiUpdateViews()    // PUT /api/v1/user/views
    }
    updateViews()
  }, [])

  // Chạy mỗi khi token thay đổi: Fetch thông tin user
  useEffect(() => {
    getMe()    // GET /api/v1/user/me → Cập nhật me trong store
  }, [token])  // token thay đổi (login/logout) → gọi lại getMe

  return (
    <main className="relative font-sans tracking-[0.005em] leading-relaxed">
      <Outlet />   {/* Hiển thị trang con dựa trên URL */}
      <Toaster position="top-center" expand={false} richColors />
      {/* ↑ Hiện thông báo toast (success, error...) */}
    </main>
  )
}
```

> [!NOTE]
> **`<Outlet />`** là component đặc biệt của React Router. Nó là "chỗ trống" mà React Router sẽ render trang con tương ứng với URL hiện tại. Ví dụ:
> - URL = `/` → Outlet render `<Homepage />`
> - URL = `/dang-nhap` → Outlet render `<Login />`
> - URL = `/chu-tro/tao-moi-tin-dang` → Outlet render `<CreatePost />`

## 11.3. Environment Variables

```env
# client/.env
VITE_SERVER_URL=http://localhost:8888/api/v1   # URL backend server
VITE_CLIENT_GG_ID=xxxx.apps.googleusercontent.com  # Google Client ID
VITE_EXCHANGERATE_API=xxxx                     # ExchangeRate API key
```

> [!IMPORTANT]
> Tất cả biến môi trường trong Vite **bắt buộc** phải có prefix `VITE_`. Nếu không có prefix, biến sẽ KHÔNG được inject vào client code (vì lý do bảo mật).

---

# CHƯƠNG 12: STATE MANAGEMENT (ZUSTAND)

## 12.1. Zustand Là Gì? Tại Sao Cần?

**Vấn đề:** Khi user đăng nhập, thông tin user cần được dùng ở NHIỀU components khác nhau (Header hiện tên, Sidebar hiện avatar, CreatePost dùng user ID...). Nếu truyền data qua props thì rất phức tạp.

**Giải pháp:** Zustand tạo một **global store** (kho dữ liệu toàn cục) — mọi component đều truy cập được.

```
Không có Zustand:                     Có Zustand:
App → Header (truyền user)            ┌──────────────┐
App → Sidebar (truyền user)           │  Zustand     │
App → Content → Post (truyền user)    │  Store       │
    ↑ Phải truyền qua nhiều tầng      │  { user,     │
    ↑ Rất phiền!                       │    token }   │
                                       └──────┬───────┘
                                              │
                                    ┌─────────┼─────────┐
                                    ↓         ↓         ↓
                                 Header    Sidebar   PostCard
                                 (đọc user) (đọc user) (đọc user)
```

## 12.2. useMeStore — Lưu Thông Tin User

```javascript
// client/src/zustand/useMeStore.js
export const useMeStore = create(
  persist(                              // persist = lưu vào localStorage
    (set) => ({
      // ═══════ STATE (Dữ liệu) ═══════
      token: null,        // JWT token (nhận khi đăng nhập)
      me: null,           // Object thông tin user
      googleData: null,   // Data từ Google OAuth

      // ═══════ ACTIONS (Hành động) ═══════

      // Đặt token mới
      setToken: (token) => set(() => ({ token })),

      // Đặt thông tin user
      setMe: (me) => set(() => ({ me })),

      // Đặt data Google
      setGoogleData: (googleData) => set(() => ({ googleData })),

      // Fetch thông tin user từ server
      getMe: async () => {
        try {
          const response = await apiGetMe()   // GET /api/v1/user/me
          if (response.data.success)
            return set(() => ({ me: response.data.user }))
          return set(() => ({ me: null }))     // Token hết hạn
        } catch (error) {
          return set(() => ({ me: null }))
        }
      },

      // Đăng xuất = xóa token + user info
      logout: () => set(() => ({ token: null, me: null })),
    }),
    {
      name: "trohub/me",                          // Key trong localStorage
      storage: createJSONStorage(() => localStorage),
      // Chỉ lưu token và me vào localStorage (không lưu functions)
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            (el) => el[0] === "token" || el[0] === "me"
          )
        ),
    }
  )
)
```

**Cách sử dụng trong Component:**
```jsx
// Bất kỳ component nào cũng có thể đọc/ghi
const MyComponent = () => {
  const { me, token, logout } = useMeStore()

  return (
    <div>
      {me ? (
        <>
          <span>Xin chào, {me.fullname}!</span>
          <button onClick={logout}>Đăng xuất</button>
        </>
      ) : (
        <Link to="/dang-nhap">Đăng nhập</Link>
      )}
    </div>
  )
}
```

## 12.3. useSearchStore — Lưu Bộ Lọc Tìm Kiếm

```javascript
// client/src/zustand/useSearchStore.js
export const useSearchStore = create((set, get) => ({
  currentSearchParams: [],  // Mảng các filter đang active

  // Cập nhật 1 filter
  setCurrentSearchParams: (searchParam) => {
    const { type, isMultiple, value } = searchParam
    const { currentSearchParams } = get()

    // Nếu value rỗng → xóa filter đó
    if (!value)
      return set(() => ({
        currentSearchParams: currentSearchParams.filter(el => el.type !== type)
      }))

    // Nếu không cho phép multiple → thay thế filter cùng type
    let newParams = currentSearchParams
    if (!isMultiple) {
      newParams = [
        ...currentSearchParams.filter(el => el.type !== type),
        searchParam
      ]
    }

    return set(() => ({ currentSearchParams: newParams }))
  },

  // Reset tất cả filter
  resetSearchStore: () => set(() => ({ currentSearchParams: [] })),
}))
```

**Ví dụ sử dụng:**
```javascript
// Khi user nhấn filter "Giá 1-2 triệu":
setCurrentSearchParams({
  type: "price",               // Loại filter
  isMultiple: false,           // Chỉ 1 khoảng giá
  value: "[1000000, 2000000]"  // Giá trị
})
// currentSearchParams = [{ type: "price", value: "[1000000, 2000000]" }]
```

---

# CHƯƠNG 13: API LAYER & SWR

## 13.1. Axios Configuration

```javascript
// client/src/apis/axios.js

// Tạo Axios instance với base URL
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL  // http://localhost:8888/api/v1
})

// Request Interceptor — Tự động gắn token vào mỗi request
axiosInstance.interceptors.request.use((config) => {
  // Lấy token từ localStorage (Zustand persist vào đây)
  const store = window.localStorage.getItem("trohub/me")
  if (store) {
    const parsedStore = JSON.parse(store)
    if (parsedStore?.state?.token) {
      config.headers.Authorization = `Bearer ${parsedStore.state.token}`
      // ↑ Gắn vào header: Authorization: Bearer eyJhbGci...
    }
  }
  return config
})

// Response Interceptor — Xử lý lỗi chung
axiosInstance.interceptors.response.use(
  (res) => res,              // Thành công → trả response
  (error) => Promise.reject(  // Lỗi → format error message
    (error.response && error.response.data) || "Something went wrong."
  )
)
```

> [!TIP]
> **Interceptor** như "một bộ lọc tự động". Request interceptor chạy TRƯỚC mỗi request (tự động gắn token). Response interceptor chạy SAU mỗi response (tự động xử lý lỗi). Bạn không cần viết code gắn token ở mỗi API call.

## 13.2. Endpoints Definition — Bảng Đối Chiếu URL

```javascript
// Toàn bộ endpoints được định nghĩa tập trung
export const endpoints = {
  auth: {
    googleLogin: "/auth/google",
    loginEmail: "/auth/login-email",
    loginPhone: "/auth/login-phone",
    registerPhone: "/auth/register-phone",
    registerEmail: "/auth/register-email",
  },
  user: {
    getMe: "/user/me",
    updateMe: "/user/me",
    sendOtpPhone: "/user/send-otp",
    deposit: "/user/deposit",
    addWishlist: "/user/wishlist",
    // ... và nhiều hơn
  },
  post: {
    createNew: "/post/new",
    getUserPost: "/post/user",
    getPublicPosts: "/post/public/",
    getPostById: "/post/one/",
    ratingPost: "/post/rating/",
    // ... và nhiều hơn
  },
  payment: {
    depositVnpay: "/payment/deposit",
    depositMomo: "/payment/momo/create",
  },
  // ... admin, order, news...
}
```

## 13.3. API Functions — Imperative Calls

Đây là các hàm gọi API dạng "chủ động" (gọi khi user action):

```javascript
// Đăng nhập
export const apiLoginWithEmail = (data) =>
  axios({ method: "post", url: endpoints.auth.loginEmail, data })

// Tạo tin đăng
export const apiCreateNewPost = (data) =>
  axios({ method: "post", url: endpoints.post.createNew, data })

// Đánh giá sao
export const apiRatingPost = (data) =>
  axios({ method: "post", url: endpoints.post.ratingPost, data })

// Nạp tiền VNPay
export const apiDepositMoney = (data) =>
  axios({ method: "post", url: endpoints.payment.depositVnpay, data })
```

## 13.4. SWR Hooks — Declarative Data Fetching

Đây là các custom hooks dùng SWR cho **GET requests** (lấy dữ liệu):

```javascript
// Hook lấy danh sách tin đăng công khai
export const useGetPublicPosts = (params, options) => {
  // Tạo URL với params
  const URL = params
    ? [endpoints.post.getPublicPosts, { params }]
    : endpoints.post.getPublicPosts

  // SWR tự động:
  // 1. Gọi API khi component mount
  // 2. Cache kết quả
  // 3. Auto refresh khi focus
  // 4. Auto retry khi lỗi
  const { data, isLoading, isValidating, error, mutate } =
    useSWR(URL, internalFetcher, options)

  // Memoize để tránh re-render không cần thiết
  const memoizedValue = useMemo(() => ({
    data: data?.data ? data.data : data,
    isLoading,      // true khi đang load lần đầu
    isValidating,   // true khi đang refresh ngầm
    error,          // Error object nếu có lỗi
    mutate,         // Hàm để manual refresh
  }), [isLoading, isValidating, error, data])

  return memoizedValue
}
```

**Cách sử dụng trong Component:**
```jsx
const PostList = () => {
  const { data, isLoading } = useGetPublicPosts({
    page: 1,
    limit: 10,
    province: "Hà Nội"
  })

  if (isLoading) return <Spinner />  // Hiện loading

  return (
    <div>
      {data?.posts?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

---

# CHƯƠNG 14: ROUTING & NAVIGATION

## 14.1. Hệ Thống URL (Pathnames)

```javascript
// client/src/lib/pathnames.js — Tất cả URL paths
const pathnames = {
  publics: {
    homepage: "",                          // /
    login: "dang-nhap",                    // /dang-nhap
    chothuecanho: "cho-thue-can-ho",       // /cho-thue-can-ho
    nhachothue: "nha-cho-thue",            // /nha-cho-thue
    chothuephongtro: "cho-thue-phong-tro", // /cho-thue-phong-tro
    search: "tim-kiem",                    // /tim-kiem
    detailPost_idPost: "chi-tiet-tin-dang/:idPost",  // /chi-tiet-tin-dang/123
    news: "tin-tuc",                       // /tin-tuc
    detailNews__id: "chi-tiet-tin-tuc/:id",
    payment__status: "thanh-toan/:code",   // /thanh-toan/00
    resetPassword: "Reset-mat-khau",
    updatePassword: "cap-nhat-mat-khau",
  },
  user: {
    layout: "thanh-vien/",                 // URL group prefix
    personal: "ca-nhan",                   // /thanh-vien/ca-nhan
    changeEmail: "cap-nhat-email",
    changePhone: "cap-nhat-so-dien-thoai",
    wishlist: "tin-dang-yeu-thich",
    seenPost: "tin-dang-da-xem",
    depositVnpay: "nap-tien-vnpay",
    paymentHistory: "lich-su-nap-tien",
    expiredHistory: "lich-su-gia-han",
    balanceInfo: "thong-tin-so-du",
  },
  owner: {
    layout: "chu-tro/",
    general: "tong-quan",
    createPost: "tao-moi-tin-dang",        // /chu-tro/tao-moi-tin-dang
    managePost: "quan-ly-tin-dang",
    manageOrder: "quan-ly-hoa-don",
  },
  admin: {
    layout: "admin/",
    general: "tong-quan",                   // /admin/tong-quan
    manageUser: "quan-ly-thanh-vien",
    createNews: "tao-moi-tin-tuc",
    manageNews: "quan-ly-tin-tuc",
  },
}
```

## 14.2. Route Configuration — Cấu Hình Routing

```jsx
// client/src/routes.jsx — Defintion của toàn bộ routes
const routes = [
  {
    path: "/",
    element: <App />,              // Root layout
    children: [
      // ═══════ PUBLIC ROUTES (ai cũng xem được) ═══════
      {
        path: "",                  // Prefix: "" (root)
        element: <PublicLayout />, // Layout: Header + Footer
        children: [
          { path: "", element: <Homepage /> },              // /
          { path: "dang-nhap", element: <Login /> },        // /dang-nhap
          { path: "tim-kiem", element: <SearchLayout /> },   // /tim-kiem
          { path: "chi-tiet-tin-dang/:idPost", element: <DetailPost /> },
          { path: "tin-tuc", element: <News /> },
          { path: "cho-thue-phong-tro", element: <ChoThuePhongTro /> },
          { path: "nha-cho-thue", element: <NhaChoThue /> },
          { path: "cho-thue-can-ho", element: <ChoThueCanHo /> },
          // ...
        ],
      },

      // ═══════ USER ROUTES (cần đăng nhập) ═══════
      {
        path: "thanh-vien/",           // Prefix: /thanh-vien/
        element: <UserLayout />,       // Layout: Sidebar + Content
        children: [
          { path: "ca-nhan", element: <Personal /> },
          { path: "cap-nhat-email", element: <ChangeEmail /> },
          { path: "cap-nhat-so-dien-thoai", element: <ChangePhone /> },
          { path: "tin-dang-yeu-thich", element: <Wishlist /> },
          { path: "nap-tien-vnpay", element: <DepositVnpay /> },
          // ...
        ],
      },

      // ═══════ OWNER ROUTES (cần role Chủ trọ) ═══════
      {
        path: "chu-tro/",             // Prefix: /chu-tro/
        element: <OwnerLayout />,
        children: [
          { path: "tao-moi-tin-dang", element: <CreatePost /> },
          { path: "quan-ly-tin-dang", element: <ManagePost /> },
          { path: "quan-ly-hoa-don", element: <ManageOrder /> },
        ],
      },

      // ═══════ ADMIN ROUTES (cần role Admin) ═══════
      {
        path: "admin/",               // Prefix: /admin/
        element: <AdminLayout />,
        children: [
          { path: "tong-quan", element: <AdminGeneral /> },
          { path: "quan-ly-thanh-vien", element: <ManageUser /> },
          { path: "tao-moi-tin-tuc", element: <CreateNews /> },
          { path: "quan-ly-tin-tuc", element: <ManageNews /> },
        ],
      },
    ],
  },
]
```

**Sơ đồ Route Tree:**
```
/ (App)
├── / (PublicLayout)
│   ├── / → Homepage
│   ├── /dang-nhap → Login
│   ├── /tim-kiem → SearchLayout
│   ├── /chi-tiet-tin-dang/:id → DetailPost
│   ├── /cho-thue-phong-tro → ChoThuePhongTro
│   ├── /nha-cho-thue → NhaChoThue
│   ├── /cho-thue-can-ho → ChoThueCanHo
│   ├── /tin-tuc → News
│   └── /chi-tiet-tin-tuc/:id → DetailNews
│
├── /thanh-vien/ (UserLayout)
│   ├── ca-nhan → Personal
│   ├── cap-nhat-email → ChangeEmail
│   ├── tin-dang-yeu-thich → Wishlist
│   ├── nap-tien-vnpay → DepositVnpay
│   └── lich-su-nap-tien → PaymentHistory
│
├── /chu-tro/ (OwnerLayout)
│   ├── tao-moi-tin-dang → CreatePost
│   ├── quan-ly-tin-dang → ManagePost
│   └── quan-ly-hoa-don → ManageOrder
│
└── /admin/ (AdminLayout)
    ├── tong-quan → AdminGeneral (Dashboard)
    ├── quan-ly-thanh-vien → ManageUser
    ├── tao-moi-tin-tuc → CreateNews
    └── quan-ly-tin-tuc → ManageNews
```

---

# CHƯƠNG 15: CÁC TRANG & COMPONENTS

## 15.1. Tổng Quan Các Layout

### PublicLayout — Trang Công Khai
```
┌─────────────────────────────────────────┐
│              HEADER                      │
│  Logo │ Menu │ Search │ Login/Avatar    │
├─────────────────────────────────────────┤
│                                         │
│            <Outlet />                   │
│    (Hiển thị Homepage/Search/Detail)    │
│                                         │
├─────────────────────────────────────────┤
│              FOOTER                      │
└─────────────────────────────────────────┘
```

### UserLayout / OwnerLayout / AdminLayout — Dashboard
```
┌──────────┬──────────────────────────────┐
│          │                              │
│ SIDEBAR  │        <Outlet />            │
│          │   (Content Area)             │
│ - Cá nhân│                              │
│ - Số dư  │                              │
│ - Tin    │                              │
│   đăng   │                              │
│ - Hóa đơn│                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

## 15.2. Trang Public — Phân Tích Chi Tiết

### Homepage.jsx — Trang Chủ

**Các section trên trang chủ:**
1. **Hero Banner** — Banner giới thiệu + ô tìm kiếm nhanh
2. **Tỉnh/Thành nổi bật** — 6 thành phố lớn (Hà Nội, HCM, Đà Nẵng...)
3. **Tin đăng mới nhất** — Danh sách tin đăng gần đây
4. **Tin tức** — Bài viết mới từ admin

### Login.jsx — Trang Đăng Nhập (12KB - Phức tạp nhất)

**Các tab trên trang Login:**
1. Tab Đăng nhập Email
2. Tab Đăng nhập SĐT
3. Tab Đăng ký Email
4. Tab Đăng ký SĐT
5. Button đăng nhập Google

**Luồng đăng nhập Email:**
```
1. User nhập email + password
2. Click "Đăng nhập"
3. Gọi apiLoginWithEmail({ email, password })
4. Server trả về { success: true, accessToken: "eyJhbG..." }
5. Lưu token: setToken(accessToken)
6. Zustand persist vào localStorage
7. App.jsx detect token change → gọi getMe()
8. UI cập nhật: hiện avatar + tên thay nút đăng nhập
```

**Luồng đăng nhập Google:**
```
1. User click "Đăng nhập Google"
2. Google OAuth popup hiện lên
3. User chọn tài khoản Google
4. Nhận access_token từ Google
5. Gọi Google API lấy thông tin: email, name, avatar
6. Gửi đến server: apiGoogleLogin({ fullname, email, avatar })
7. Server: findOrCreate user → tạo JWT token
8. Client lưu token → tự động login
```

### SearchLayout.jsx — Trang Tìm Kiếm (7.5KB)

**Bộ lọc tìm kiếm gồm:**
- Tìm theo tên/từ khóa
- Chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã
- Khoảng giá (dropdown 9 mức)
- Diện tích (dropdown 9 mức)
- Tiện ích (checkbox multiple: WiFi, Điều hòa...)
- Sắp xếp (mới nhất, giá cao→thấp, A→Z...)

### DetailPost.jsx — Chi Tiết Tin Đăng (7.5KB)

**Nội dung hiển thị:**
```
┌─────────────────────────────────────────┐
│  [Ảnh/Video Gallery]                    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│  │📷│ │📷│ │📷│ │📷│               │
│  └───┘ └───┘ └───┘ └───┘               │
├─────────────────────────────────────────┤
│  Tiêu đề:  Phòng trọ cao cấp quận 1   │
│  Giá:      3.5 triệu/tháng            │
│  Diện tích: 25 m²                       │
│  Địa chỉ:  123 Nguyễn Huệ, Q1, HCM   │
│  Giới tính: Tất cả                      │
│  Phòng ngủ: 1 │ Phòng tắm: 1          │
│  Tiện ích:  WiFi, Điều hòa, Máy giặt  │
├─────────────────────────────────────────┤
│  📝 MÔ TẢ CHI TIẾT                    │
│  (Rich text - Quill editor output)      │
├─────────────────────────────────────────┤
│  🗺️ BẢN ĐỒ (Leaflet map)              │
│  Hiện vị trí phòng trọ trên bản đồ    │
├─────────────────────────────────────────┤
│  ⭐ ĐÁNH GIÁ                           │
│  ★★★★☆ 4.2/5 (15 đánh giá)           │
│  [Chọn sao để đánh giá]               │
├─────────────────────────────────────────┤
│  💬 BÌNH LUẬN                          │
│  User A: "Phòng rất đẹp!"             │
│  User B: "Giá OK" → Reply...           │
│  [Viết bình luận...]                   │
├─────────────────────────────────────────┤
│  👤 THÔNG TIN CHỦ TRỌ                  │
│  Tên: Nguyễn Văn B                     │
│  Email: owner@gmail.com                │
│  SĐT: 0901234567                       │
└─────────────────────────────────────────┘
```

## 15.3. Trang Owner — Chủ Trọ

### CreatePost.jsx — Tạo Tin Đăng (15KB - Phức tạp nhất)

**Form bao gồm:**
1. Tiêu đề tin (text input)
2. Mô tả chi tiết (Quill rich text editor)
3. Chọn loại tin (Phòng trọ / Nhà / Căn hộ)
4. Chọn địa chỉ (Tỉnh → Quận → Phường - cascade dropdown)
5. Giá thuê, diện tích, phòng ngủ, phòng tắm
6. Upload ảnh/video (Dropbox integration)
7. Chọn tiện ích (checkbox: WiFi, Điều hòa...)
8. Chọn giới tính
9. Chọn gói ưu tiên (Kim cương → Thường)
10. Chọn số ngày đăng
11. Tóm tắt thanh toán

**Hệ thống gói ưu tiên:**

| Gói | Priority | Giá/ngày | Hiệu ứng |
|-----|----------|----------|-----------|
| Kim Cương | 5 | 100,000 VNĐ | Hiển thị đầu tiên |
| Bạch Kim | 4 | 80,000 VNĐ | Ưu tiên cao |
| Vàng | 3 | 60,000 VNĐ | Ưu tiên trung bình |
| Bạc | 2 | 40,000 VNĐ | Ưu tiên thấp |
| Đồng | 1 | 20,000 VNĐ | Ưu tiên rất thấp |
| Thường | 0 | 10,000 VNĐ | Hiển thị cuối |

### ManagePost.jsx — Quản Lý Tin Đăng (11.7KB)

**Chức năng:**
- Bảng (table) hiện tất cả tin đăng của chủ trọ
- Filter theo trạng thái, tên, sắp xếp
- Sửa tin đăng (mở form edit dialog)
- Xóa tin đăng (xác nhận trước khi xóa)
- Gia hạn tin đăng (chọn số ngày, trừ tiền)
- Đổi trạng thái phòng (Còn trống / Đã thuê)

### ManageOrder.jsx — Quản Lý Hóa Đơn (14KB)

**Chức năng:**
- Hiện danh sách orders (hóa đơn đăng tin)
- Trạng thái: Đang chờ / Thành công / Thất bại
- Button "Công khai": Thanh toán → tin được public
- Xóa hóa đơn

## 15.4. Trang Admin

### AdminGeneral.jsx — Dashboard (9KB)

**Thống kê hiển thị:**
1. **Biểu đồ tổng quan:**
   - Số lượng truy cập (anonymous + registered)
   - Tổng số tin đăng (theo ngày/tháng)
   - Tổng số thành viên
   - Tổng doanh thu

2. **Filter thời gian:** Chọn khoảng ngày hoặc tháng

3. **Charts:** Sử dụng Chart.js (react-chartjs-2)

### ManageUser.jsx — Quản Lý Thành Viên (12.8KB)

**Chức năng:**
- Bảng hiện tất cả users
- Tìm kiếm theo tên
- Cập nhật role (Thành viên → Chủ trọ → Admin)
- Xóa users (chọn nhiều)
- Phân trang server-side

## 15.5. Custom Hooks

### useDebounce — Chống Gọi API Liên Tục
```javascript
// Khi user gõ tìm kiếm: "H" "Hà" "Hà " "Hà N" "Hà Nộ" "Hà Nội"
// Không debounce: GỌI 6 LẦN API (lãng phí!)
// Có debounce(500ms): Chờ user ngừng gõ 500ms → GỌI 1 LẦN API

const useDebounce = (value, ms) => {
  const [debouncedValue, setDebouncedValue] = useState("")
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)     // Chỉ cập nhật sau khi ngừng gõ {ms}ms
    }, ms)
    return () => clearTimeout(timeoutId)  // Clear timer cũ nếu gõ tiếp
  }, [value, ms])
  return debouncedValue
}
```

### usePagination — Tính Toán Phân Trang
```javascript
// Input: totalCount=100, currentPage=5, limit=10, siblingCount=1
// Output: [1, null, 4, 5, 6, null, 10]
//          ↑   ↑    ↑  ↑  ↑   ↑    ↑
//       Trang1 ... Sib Current Sib ... LastPage
```

## 15.6. Utility Functions

```javascript
// Format số tiền: 5000000 → "5 triệu"
export const shortNumber = (number) => {
  if (number >= 10^9) return `${(number / 10^9).toFixed(1)} tỷ`
  if (number >= 10^6) return `${(number / 10^6).toFixed(1)} triệu`
  return `${(number / 10^3).toFixed(1)} nghìn`
}

// Format thời gian: "2 ngày 3 giờ 15 phút trước"
export const fromNow = (date) => {
  const deviation = (Date.now() - new Date(date)) / 1000  // seconds
  const days = Math.floor(deviation / 86400)
  const hours = Math.floor((deviation % 86400) / 3600)
  const minutes = Math.floor((deviation % 3600) / 60)
  return `${days > 0 ? days + " ngày " : ""}${hours > 0 ? hours + " giờ " : ""}...trước`
}

// Tạo avatar mặc định từ tên
export const generateDefaultAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${name}&background=random&rounded=true`

// Render icon giới tính
export const renderGender = (gender) => {
  if (gender === "Nam") return "/Male.svg"
  if (gender === "Nữ") return "/Female.svg"
  return "/AllGender.svg"
}
```

---

> **Tiếp tục đọc Phần 4** để hiểu chi tiết về Luồng nghiệp vụ, Bảo mật, Câu hỏi bảo vệ, và Hướng phát triển...
