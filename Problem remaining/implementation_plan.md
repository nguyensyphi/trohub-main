# 🛠️ KIẾN NGHỊ CẢI THIỆN KỸ THUẬT DỰ ÁN TROHUB (Technical Debt & Bug Fixes)

Sau khi kiểm tra toàn diện codebase (Controllers, Routes, Pages, Middlewares, Utilities, Components), mình đã phát hiện ra một loạt các vấn đề từ typo (sai chính tả), lỗi logic tiềm ẩn, thiết kế API chưa chuẩn RESTful đến các thiếu sót về cấu trúc. Dưới đây là kế hoạch chi tiết để "làm sạch" dự án, giúp code chạy ổn định và đạt chuẩn hơn cho buổi bảo vệ.

## User Review Required

> [!CAUTION]
> Các thay đổi này liên quan trực tiếp đến Data Flow và API format. Vui lòng kiểm tra kỹ các đề xuất đổi tên biến API (ví dụ: `sucess` thành `success`) vì nó có thể yêu cầu sửa lại cả ở Frontend (Client) cho đồng bộ. Bạn có đồng ý với toàn bộ các thay đổi sửa typos và refactor logic này không?

## Proposed Changes

---
### 1. Sửa Typo / Sai Chính Tả (Bắt Buộc)

Hiện tại có rất nhiều lỗi chính tả trong code. Điều này thường bị giảng viên chấm code trừ điểm rất nặng.

#### [MODIFY] [server/controllers/post.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/post.controller.js)
1. **Dòng 195:** Trong API `getPostById`, kết quả trả về đang viết sai chữ `success`:
   `sucess: !!response,` -> Đổi thành `success: !!response,`
   *(Lưu ý: Phải sửa cả file client dùng hàm này nếu client dùng `res.sucess`)*

#### [MODIFY] [server/routes/post.route.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/routes/post.route.js)
1. Route có prefix lạ (chữ `New` trong CRUD nên viết thường hoặc dùng HTTP methods chuẩn RESTful). Vấn đề nghiêm trọng là thư mục/tên file `new.controller.js` và model `New` bị dùng từ khóa trùng với reserved keyword của Javascript (lệnh `new Class()`). Cần cẩn trọng dù ORM đang cho qua.

#### [MODIFY] [server/controllers/order.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/order.controller.js)
1. **Dòng 18-19:** Sai chính tả cực kỳ nguy hiểm trong `include` Sequelize:
   `attibutes: ["id", "fullname", "avatar"]` -> Đổi thành `attributes`
   *(Nếu sai `attributes`, Sequelize sẽ lấy TOÀN BỘ cột thay vì chỉ lấy các cột cần thiết, gây lộ cả mật khẩu!)*

#### [MODIFY] [server/controllers/new.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/new.controller.js)
1. **Dòng 33, 63, 110:** Lại sai y hệt lỗi `attibutes`:
   `attibutes: ["id", "fullname", "avatar"]` -> Đổi thành `attributes`
2. **Dòng 99:** Trong API `deleteNewsByAdmin`, logic đang gọi xóa bảng `Post` thay vì bảng `News` !!
   `await db.Post.destroy(...)` -> Đổi thành `await db.New.destroy(...)`

---
### 2. Sửa lỗi Xử Lý Middleware & Router

#### [MODIFY] [server/middlewares/validate-dto.midd.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/middlewares/validate-dto.midd.js)
1. Khi Joi trả lỗi, dòng 6 dùng `replaceAll`:
   `const message = error.details[0].message?.replaceAll("\"", "")`
   Javascript cũ hoặc khi chuỗi không có ký tự có thể sinh lỗi TypeError. Nên xử lý kỹ hơn. (Lưu ý: escape string chưa chuẩn). `replace(/"/g, "")` là an toàn hơn.

#### [MODIFY] [server/routes/payment.route.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/routes/payment.route.js)
1. **Dòng 11-12 và 13-14:** Bị lặp lại route cho MoMo:
   ```javascript
   router.get("/momo/return", ctrls.handleMomoReturn)
   router.post("/momo/ipn", ctrls.handleMomoIpn)
   router.get("/momo-return", ctrls.handleMomoReturn) // Trùng logic
   router.post("/momo-ipn", ctrls.handleMomoIpn)      // Trùng logic
   ```
   **Đề xuất:** Chỉ giữ lại 1 bộ callback chuẩn (ưu tiên `/momo/return` để đồng bộ structure).

---
### 3. Cải Thiện Controllers Logic & Error Handling

#### [MODIFY] [server/controllers/user.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/user.controller.js)
1. **Dòng 115 trong `updateProfile`:** Biến `user` được tham chiếu trước khi được khai báo! (Dòng 117 mới khai báo `const user = ...`). Sẽ gây ra lỗi `ReferenceError: Cannot access 'user' before initialization`. Cần gỡ bỏ `user` ra khỏi response lỗi.
2. **Dòng 296-300 trong `deposit`:** Logic revert transaction bằng tay đang viết sai nguyên lý. Nếu `!isSuccess`, hệ thống lại cố chạy trừ tiền `decrement`? Điều gì xảy ra nếu lúc increment đã lỗi? Nó sẽ trừ luôn tiền vốn có của User!
   **Đề xuất:** Sử dụng **Sequelize Transactions (`db.sequelize.transaction`)** thay vì dùng `Promise.all` và tự revert thủ công rủi ro cao.
3. **Dòng 287:** Hardcode payment method trong Paypal: `method: "Paypal"` (tên API Deposit này vốn dành cho nạp tiền gì? VNPAY đã có API riêng, Momo có API riêng, vậy đây là đâu?).

#### [MODIFY] [client/src/apis/news.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/apis/news.js)
1. **Dòng 56:** API `deleteNews` ở server (file news.route.js dòng 37) định nghĩa là `router.delete("/delete",...)`, nhưng client Axios lại gọi `method: "put"`. Lỗi HTTP Method không thể xóa được tin! Cần đổi thành `method: "delete"`.

---
### 4. Code Mùi (Code Smells) Ở Frontend

#### Frontend Pages Indexing
Các file `index.jsx` trong thư mục `pages/` (admin, owners, users, publics) viết chuẩn. Tuy nhiên:
- Chưa sử dụng **React.lazy** hoặc Code Splitting cho App. Hậu quả là main bundle (`build/static/js/main.[hash].js`) có thể rất lớn vì nó ôm trọn thư viện Chart, Map (leaflet) chỉ dành cho 1 số trang cụ thể vào ngay khi load Homepage.

## Open Questions

> [!WARNING]
> 1. **Data Leak:** Lỗi sai chính tả chữ `attibutes` thay vì `attributes` ở nhiều controller (Order, News) làm lộ Mật khẩu Hash (password) và các field dư thừa khác của bảng User thông qua relation. Việc sửa này là bắt buộc.
> 2. Việc đổi `sucess` -> `success` / method `put` -> `delete` có làm break API test phía Client của bạn không (nếu Client đang cố trick theo cái sai của Server)?
> 3. Bạn có muốn mình refactor đoạn `deposit` bằng Transaction chuẩn luôn không, thay vì rollback tay nguy hiểm?

## Verification Plan

### Automated Tests
- Thực hiện kiểm tra nội bộ qua ESLint/Prettier (nếu có)
- (Do dự án không có unit test)

### Manual Verification
1. Gọi API Get Order `/api/v1/order/all` bằng Postman/Browser (người dùng chủ trọ) để xác minh `rUser` không còn phơi bày toàn bộ dữ liệu (như password).
2. Thử tạo mới News và gọi API Delete News trên giao diện Admin. Đảm bảo News bị xóa, CHỨ KHÔNG phai tin đăng (Post) bị xóa oan.
3. Chỉnh sửa hồ sơ cá nhân (`updateProfile`) bằng data giả mạo tạo case lỗi để xem app còn crash vì `ReferenceError` không.
4. Đăng ký/Đăng nhập để xem quá trình cấp JWT không bị ảnh hưởng.
