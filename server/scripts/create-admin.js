/**
 * Tạo hoặc nâng cấp tài khoản admin (role "Quản trị viên").
 * Chạy từ thư mục server: npm run create-admin
 *
 * Biến môi trường (tùy chọn, trong server/.env):
 *   ADMIN_EMAIL     — mặc định admin@trohub.local
 *   ADMIN_PASSWORD  — mật khẩu đăng nhập (mặc định Admin@123456 — đổi ngay sau lần đầu)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const bcrypt = require("bcryptjs")
const db = require("../models")

const email = (process.env.ADMIN_EMAIL || "admin@trohub.local").trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || "Admin@123456"

async function main() {
  if (!email || !password) {
    console.error("Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD.")
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 10)
  const existing = await db.User.findOne({ where: { email } })

  if (existing) {
    await existing.update({
      role: "Quản trị viên",
      password: hashed,
      emailVerified: true,
    })
    console.log(`Đã cập nhật tài khoản admin: ${email}`)
  } else {
    await db.User.create({
      fullname: "Quản trị viên",
      email,
      password: hashed,
      role: "Quản trị viên",
      emailVerified: true,
      balance: 0,
    })
    console.log(`Đã tạo tài khoản admin: ${email}`)
  }

  console.log("Đăng nhập tại trang /dang-nhap (email + mật khẩu), sau đó vào /admin/tong-quan")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
