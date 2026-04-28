import { Navigate, useNavigate, useOutlet } from "react-router-dom"
import { NavUser } from "@/common/components/sidebar/nav/NavUser"
import { NavUserMenuItems } from "@/common/components/sidebar/nav/NavUserMenuItems"
import { Logo } from "@/common/components/themes/Logo"
import type { User } from "@/common/features/me/me.models"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { RouteNames } from "@/common/routes/helpers"

export function EvalDashboardRoute({
  user,
  organization,
}: {
  user: User
  organization: Organization
}) {
  const outlet = useOutlet()
  return (
    <>
      <Header user={user} organization={organization} />
      <div className="w-4/5 lg:w-3/4 mx-auto my-10 relative border rounded-2xl overflow-hidden">
        {outlet ? outlet : <Navigate to={RouteNames.HOME} />}
      </div>
    </>
  )
}

function Header({ user, organization }: { user: User; organization: Organization }) {
  const navigate = useNavigate()
  const handleClick = () => {
    navigate(RouteNames.HOME)
  }
  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-4 gap-2">
      <button type="button" className="p-1 size-10 contain-content" onClick={handleClick}>
        <Logo />
      </button>

      <button type="button" onClick={handleClick} className="flex-1">
        <div className="flex flex-col gap-0 leading-none text-left">
          <span className="font-medium text-lg">{organization.name}</span>

          <span className="text-primary font-medium">Evaluation</span>
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
