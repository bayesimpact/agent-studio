import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildAdminPath, buildAppPath, RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

export function HomeRoute() {
  const { admin } = useAbility()
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to onboarding (which will check for organizations)
        navigate(
          admin ? buildAdminPath(RouteNames.ONBOARDING) : buildAppPath(RouteNames.ONBOARDING),
          { replace: true },
        )
      } else {
        // User is not authenticated, redirect to Auth0 login
        loginWithRedirect()
      }
    }
  }, [admin, isLoading, isAuthenticated, navigate, loginWithRedirect])

  // Show loading while checking authentication status
  return <LoadingRoute />
}
