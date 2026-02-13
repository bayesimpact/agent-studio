import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { AUTH0_ORGANIZATION_ID } from "@/config/auth0.config"
import { LoadingRoute } from "./LoadingRoute"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to Auth0 login if not authenticated
      loginWithRedirect({
        authorizationParams: {
          organization: AUTH0_ORGANIZATION_ID,
        },
      })
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading) return <LoadingRoute />
  if (!isAuthenticated) return <LoadingRoute />

  return <>{children}</>
}
