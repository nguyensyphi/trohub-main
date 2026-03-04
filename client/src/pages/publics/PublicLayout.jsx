import { Header } from "@/components/headers"
import { Footer } from "@/components/layouts"
import { Navigation } from "@/components/navigations"
import { Outlet } from "react-router-dom"

const PublicLayout = () => {
  return (
    <div className="bg-white">
      <Header />
      <Navigation />
      <div className="h-[calc(100vh-110px)] flex flex-col">
        <div className="flex-auto">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default PublicLayout
