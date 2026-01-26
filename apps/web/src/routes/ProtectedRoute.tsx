import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { LoadingRoute } from "./LoadingRoute"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to Auth0 login if not authenticated
      loginWithRedirect()
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading) return <LoadingRoute />
  if (!isAuthenticated) return <LoadingRoute /> // Will redirect via useEffect

  return <>{children}</>
}
