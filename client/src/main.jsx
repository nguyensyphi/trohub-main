import { createRoot } from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import routes from "./routes"
import { GoogleOAuthProvider } from "@react-oauth/google"

const googleClientId = (import.meta.env.VITE_CLIENT_GG_ID || "").trim()
if (!googleClientId && import.meta.env.DEV) {
  console.warn(
    "[TroHub] Thiếu VITE_CLIENT_GG_ID — đăng nhập Google sẽ lỗi. Thêm biến này vào .env và rebuild."
  )
}

const router = createBrowserRouter(routes)

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
)
