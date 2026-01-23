import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { selectMe, selectMeStatus } from "@/features/me/me.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"

export function DashboardRoute() {
  const { isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizations)
  const meStatus = useAppSelector(selectMeStatus)
  const meUser = useAppSelector(selectMe)
  const user = meStateToUser(meUser)

  useEffect(() => {
    // If user data is loaded and has no organizations, redirect to onboarding
    if (meStatus === "succeeded" && organizations.length === 0) {
      navigate("/onboarding", { replace: true })
    }
  }, [meStatus, organizations, navigate])

  if (isLoading || meStatus === "loading") return <LoadingRoute />

  if (isAuthenticated && user && organizations.length > 0) {
    return <DashboardLayout user={user} />
  }

  // Show loading while redirecting
  return <LoadingRoute />
}
