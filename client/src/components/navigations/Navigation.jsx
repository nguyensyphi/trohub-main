import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { navigations } from "@/lib/constant"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "react-router-dom"

const Navigation = () => {
  const location = useLocation()
  return (
    <div className="h-11 text-sm text-primary-foreground grid place-content-center bg-primary shadow-sm top-[70px] z-10 sticky border-b border-primary/20">
      <NavigationMenu>
        <NavigationMenuList className="w-main flex items-center justify-start h-full m-auto">
          {navigations.map((el) => (
            <NavigationMenuItem
              className={cn(
                "h-11 cursor-pointer flex items-center transition-colors hover:bg-primary-foreground/15",
                location.pathname === "/" + el.pathname && "bg-primary-foreground/20"
              )}
              key={el.id}
            >
              <NavigationMenuLink asChild>
                <Link className="px-4 h-full flex font-semibold items-center" to={el.pathname}>
                  {el.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export default Navigation
