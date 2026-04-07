import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useAppSelector } from "@/common/store/hooks"
import { AUTH0_ORGANIZATION_ID } from "@/config/auth0.config"
import { useSetCurrentIds } from "@/hooks/use-set-current-ids"
import { LoadingRoute } from "./LoadingRoute"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const isPlatformLoading = useAppSelector((state) => state.auth.isLoading)

  useSetCurrentIds()

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

  if (isLoading || isPlatformLoading || !isAuthenticated) return <LoadingRoute />

  return <>{children}</>
}
