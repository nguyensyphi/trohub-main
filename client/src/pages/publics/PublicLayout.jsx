import { Header } from "@/components/headers"
import { Footer } from "@/components/layouts"
import { Navigation } from "@/components/navigations"
import { Outlet } from "react-router-dom"

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <div className="h-[calc(100vh-70px-2.75rem)] flex flex-col min-h-0">
        <div className="flex-auto">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default PublicLayout
