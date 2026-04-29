import { Navigate, useOutlet } from "react-router-dom"
import { HorizontalNavbar } from "@/common/components/sidebar/nav/HorizontalNavbar"
import type { User } from "@/common/features/me/me.models"
import { RouteNames } from "@/common/routes/helpers"

export function EvalDashboardRoute({ user }: { user: User }) {
  const outlet = useOutlet()
  return (
    <>
      <HorizontalNavbar user={user} appName="Evaluation" />
      <div className="w-4/5 lg:w-3/4 mx-auto my-10 relative border rounded-2xl overflow-hidden">
        {outlet ? outlet : <Navigate to={RouteNames.HOME} />}
      </div>
    </>
  )
}
