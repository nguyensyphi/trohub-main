# 🛠️ KIẾN NGHỊ CẢI THIỆN KỸ THUẬT DỰ ÁN TROHUB (Technical Debt, Bugs & UI/UX)

Sau khi kiểm tra toàn diện codebase, mình đã cập nhật kế hoạch để bao gồm cả các lỗi backend nghiêm trọng và các vấn đề về Giao diện (UI/UX) trên Frontend. Các vấn đề hiện tại có thể khiến app bị crash, lộ dữ liệu hoặc gãy layout trên điện thoại.

## User Review Required

> [!CAUTION]
> Các thay đổi này liên quan trực tiếp đến Data Flow và giao diện.
> - **Backend:** Sửa các lỗi dẫn đến nguy cơ lộ dữ liệu User (lộ Password) và crash server.
> - **Frontend:** Sửa lỗi gãy layout hiển thị trên Mobile và dọn dẹp các dòng code rác (`console.log`) làm chậm tốc độ render.
> 
> Bạn có đồng ý với toàn bộ các thay đổi dưới đây không?

## Proposed Changes

---
### PHẦN 1: BẢO MẬT & BACKEND LOGIC (Quan Trọng)

#### [MODIFY] [server/controllers/order.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/order.controller.js)
- **Lỗi:** Sai chính tả "attibutes" thành `attibutes` trong lệnh include Sequelize. Lỗi này khiến Sequelize ignore việc lọc cột, dẫn đến việc lấy TOÀN BỘ thông tin (có cả Password hash) gửi về Client.
- **Sửa:** Đổi `attibutes` -> `attributes` ở dòng 18, 19.

#### [MODIFY] [server/controllers/new.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/new.controller.js)
- **Lỗi 1:** Tương tự `order.controller`, sai `attibutes` thành `attributes` ở các dòng 33, 63, 110.
- **Lỗi 2 (Nghiêm trọng):** Hàm định xóa News nhưng lại gọi xóa Post: `db.Post.destroy(...)` (dòng 99). Cần phải đổi thành `db.New.destroy(...)`.

#### [MODIFY] [server/controllers/post.controller.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/server/controllers/post.controller.js)
- **Lỗi:** Typo khi trả kết quả thành công ở dòng 195: `sucess: !!response`. Cần đổi chuẩn thành `success: !!response`.

#### [MODIFY] [client/src/apis/news.js](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/apis/news.js)
- **Lỗi:** API `apiDeleteNews` dùng method `put` (dòng 56) trong khi server định nghĩa là `delete`. Cần đổi lại method thành `delete`.

---
### PHẦN 2: FRONTEND UI/UX & LAYOUT (Lỗi Thiết Kế)

#### Nguy cơ gãy giao diện (Responsive Layouts)
Các trang Dashboard hiện tại sử dụng fixed Sidebar (`w-[296px]`) mà **không ẩn đi trên mobile**. Khi dùng điện thoại, thanh Sidebar này sẽ che khuất toàn bộ nội dung chính vì nó cố định 296px trên màn hình nhỏ. Hệ thống đã có Hamburger Menu ở thẻ `<Header />` để làm chức năng menu trên mobile, do đó Sidebar ở Layout bắt buộc phải bị ẩn khi ở màn hình di động.

#### [MODIFY] [client/src/pages/owners/OwnerLayout.jsx](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/pages/owners/OwnerLayout.jsx)
- **Sửa:** Thêm breakpoint `hidden lg:block` vào wrapper của sidebar.

#### [MODIFY] [client/src/pages/admin/AdminLayout.jsx](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/pages/admin/AdminLayout.jsx)
- **Sửa:** Thêm breakpoint `hidden lg:block` vào wrapper của sidebar.

#### [MODIFY] [client/src/pages/users/UserLayout.jsx](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/pages/users/UserLayout.jsx)
- **Sửa:** Thêm breakpoint `hidden lg:block` vào wrapper của sidebar.

#### Dọn dẹp Code Rác (Leftover Console.Logs)
Trong quá trình code, có rất nhiều lệnh `console.log` bị bỏ quên. Điều này không được phép xuất hiện trong production code vì giảng viên có thể kiểm tra tab Console và sẽ trừ điểm tính chuyên nghiệp. Các file cần dọn dẹp:
- `client/src/zustand/useMeStore.js`
- `client/src/pages/publics/SearchLayout.jsx`
- `client/src/pages/publics/Login.jsx`
- `client/src/pages/admin/ManageUser.jsx`
- `client/src/components/searchs/PopoverRange.jsx`
- `client/src/components/layouts/CustomAddressV2.jsx`

#### [MODIFY] [client/src/pages/publics/DetailPost.jsx](file:///c:/Users/LENOVO/Downloads/%C4%90%E1%BB%92%20%C3%81N/trohub-main/client/src/pages/publics/DetailPost.jsx)
- **Sửa:** Ở dòng 74, có typo khá "quê": `return <p>Loaing...</p>`. Cần sửa thành `Loading...` hoặc tốt nhất là thay thế bằng Spinner component.
- Xóa `console.log(response)` ở dòng 35.

## Open Questions

> [!WARNING]
> Những sửa đổi Layout ở phần 2 sẽ giúp ứng dụng của bạn không bị "bể" khi Thầy cô thu nhỏ trình duyệt để test trên mobile/tablet giả lập. Bạn có đồng ý áp dụng tất cả các bản vá Backend (chống leak password) và dọn dẹp UI (làm sạch console/Responsive) không?

## Verification Plan

### Automated Tests
- Kiểm tra lại cú pháp sau khi thay thế `console.log` bằng ESLint.

### Manual Verification
1. **Bảo mật:** Verify lại endpoint `/api/v1/order/all` bằng Swagger/Postman hoặc bắt network payload trên browser, để chắc chắn không còn lộ field password của user nữa.
2. **Giao diện:** Thu nhỏ màn hình trình duyệt xuống mức điện thoại di động ở trang `http://localhost:5173/chu-tro/tong-quan`, xác minh sidebar đã bị ẩn dọn dẹp, nhường chỗ cho nội dung chính.
3. Chạy luồng xóa tin tức từ đầu đến cuối xem còn lỗi 403 / lỗi không gọi được API do lệch http Method (PUT vs DELETE) không.
