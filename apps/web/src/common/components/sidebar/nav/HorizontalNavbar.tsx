import { useNavigate } from "react-router-dom"
import { NavUser } from "@/common/components/sidebar/nav/NavUser"
import { NavUserMenuItems } from "@/common/components/sidebar/nav/NavUserMenuItems"
import { Logo } from "@/common/components/themes/Logo"
import type { User } from "@/common/features/me/me.models"
import { RouteNames } from "@/common/routes/helpers"

export function HorizontalNavbar({
  user,
  homePath,
  appName,
}: {
  user: User
  homePath?: string
  appName: string
}) {
  const navigate = useNavigate()
  const goHome = () => navigate(homePath ?? RouteNames.HOME)
  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-4 gap-2">
      <button type="button" className="p-1 size-10 contain-content" onClick={goHome}>
        <Logo />
      </button>

      <button type="button" onClick={goHome} className="flex-1">
        <div className="flex flex-col gap-0 leading-none text-left">
          <span className="text-primary font-medium">{appName}</span>
        </div>
      </button>

      <div>
        <NavUser user={user}>
          <NavUserMenuItems />
        </NavUser>
      </div>
    </div>
  )
}
