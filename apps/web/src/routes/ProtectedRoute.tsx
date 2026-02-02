import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useInitAbility } from "@/hooks/use-init-ability"
import { LoadingRoute } from "./LoadingRoute"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useInitAbility()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to Auth0 login if not authenticated
      loginWithRedirect()
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading) return <LoadingRoute />
  if (!isAuthenticated) return <LoadingRoute />

  return <>{children}</>
}
