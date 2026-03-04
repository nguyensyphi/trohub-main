import { Header } from "@/components/headers"
import { UserSidebar } from "@/components/sidebars"
import pathnames from "@/lib/pathnames"
import { useMeStore } from "@/zustand/useMeStore"
import { Navigate, Outlet } from "react-router-dom"
import { toast } from "sonner"

const OwnerLayout = () => {
  const { me } = useMeStore()
  if (!me || me.role === "Thành viên") {
    toast.warning("Không có quyền truy cập.")
    return <Navigate to={"/" + pathnames.publics.login} replace={true} />
  }
  return (
    <div className="bg-slate-100 flex h-screen flex-col">
      <Header />
      <div className="flex flex-auto">
        <div className="w-[296px] flex-none"></div>
        <div className="w-[296px] fixed top-[70px] h-full left-0">
          <UserSidebar />
        </div>
        <div className="w-full bg-slate-100 h-full flex-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default OwnerLayout
