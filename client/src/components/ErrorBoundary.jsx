import { useRouteError } from "react-router-dom"

export const GlobalErrorBoundary = () => {
  const error = useRouteError()
  console.error("Router Error Bounds:", error)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Oops! Có lỗi bất ngờ xảy ra</h1>
      <p className="text-slate-600 mb-6">Xin lỗi, hệ thống đã gặp sự cố không mong muốn trong khi tải trang này.</p>
      <div className="bg-red-50 text-red-600 p-4 rounded-md font-mono text-sm shadow mb-6 max-w-lg overflow-auto">
        {error?.message || "Unknown React Rendering Error / Suspense Boundary Crash"}
      </div>
      <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-primary font-medium text-white rounded-md shadow">
        Quay lại Trang Chủ
      </button>
    </div>
  )
}
