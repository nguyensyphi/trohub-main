import { Link, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { CirclePlus, Heart, LogOut } from "lucide-react"
import pathnames from "@/lib/pathnames"
import { useMeStore } from "@/zustand/useMeStore"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu"
import { adminMenu, ownerMenu, userMenu } from "@/lib/constant"
import { useEffect, useState } from "react"

const Header = () => {
  const navigate = useNavigate()
  const { me, logout } = useMeStore()
  const [menu, setMenu] = useState(userMenu)

  useEffect(() => {
    if (me && me.role === "Chủ trọ") setMenu(ownerMenu)
    if (me && me.role === "Quản trị viên") setMenu(adminMenu)
  }, [me])

  const handleLogOut = () => {
    logout()
    navigate("/" + pathnames.publics.login)
  }

  return (
    <div className="h-[70px] flex-none w-full py-[15px] border-b bg-background sticky top-0 z-20 flex items-center justify-between">
      <div className="w-main flex items-center justify-between mx-auto">
        <Link to="/" className="text-4xl text-primary font-bungee">
          PHONGTROXANH
        </Link>
        <div className="flex items-center gap-3">
          {me && (
            <div className="flex items-center justify-center gap-7">
              <Link className="relative" to={"/" + pathnames.user.layout + pathnames.user.wishlist}>
                <Heart size="20" />
                {me?.rWishlist?.length > 0 && (
                  <span className="text-[8px] w-3 h-3 rounded-full grid place-content-center bg-red-500 text-white absolute -top-1 -right-1">
                    {me?.rWishlist?.length}
                  </span>
                )}
              </Link>
            </div>
          )}
          {!me && (
            <Button
              onClick={() => navigate(pathnames.publics.layout + pathnames.publics.login)}
              variant="link"
            >
              Đăng nhập / Đăng ký
            </Button>
          )}

          {me && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-bold">{me.fullname}</NavigationMenuTrigger>
                  <NavigationMenuContent className="px-4 py-2 grid min-w-48 grid-cols-1">
                    {menu.map((el) => (
                      <NavigationMenuLink asChild key={el.id}>
                        <Link
                          className="col-span-1 flex items-center gap-2 rounded text-sm hover:bg-space-holder-color px-2 whitespace-nowrap py-1 cursor-pointer"
                          to={"/" + el.path}
                        >
                          {el.icon}
                          {el.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <div className="w-full h-[1px] border-t border-slate-200 my-1"></div>
                    <div
                      onClick={handleLogOut}
                      className="col-span-1 flex items-center gap-2 rounded text-sm hover:bg-space-holder-color px-2 whitespace-nowrap py-1 cursor-pointer"
                    >
                      <LogOut size="14" />
                      <span>Đăng xuất</span>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
          <Button
            onClick={() => navigate("/" + pathnames.owner.layout + pathnames.owner.createPost)}
            variant="outline"
          >
            <span>Đăng tin mới</span>
            <CirclePlus size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Header
