import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoadingRoute } from "./LoadingRoute"

export function HomeRoute() {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to onboarding (which will check for organizations)
        navigate("/onboarding", { replace: true })
      } else {
        // User is not authenticated, redirect to Auth0 login
        loginWithRedirect()
      }
    }
  }, [isLoading, isAuthenticated, navigate, loginWithRedirect])

  // Show loading while checking authentication status
  return <LoadingRoute />
}
