import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { authActions } from "@/features/auth/auth.slice"
import { useAppDispatch } from "@/store/hooks"

/**
 * Hook to sync Auth0 authentication state with Redux.
 * This allows the listenerMiddleware to react to authentication changes
 * and automatically fetch user data when the user becomes authenticated.
 */
export function useInitApi() {
  const { isAuthenticated, isLoading } = useAuth0()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isLoading) {
      dispatch(authActions.setAuthenticated(isAuthenticated))
    }
  }, [isAuthenticated, isLoading, dispatch])
}
