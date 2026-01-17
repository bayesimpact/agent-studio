import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { setToken } from "@/features/auth/auth.slice"
import { useAppDispatch } from "@/store/hooks"

export function useInitApi() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then((token) => dispatch(setToken(token)))
        .catch(console.error)
    } else if (!isAuthenticated) {
      dispatch(setToken(null))
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently, dispatch])
}
