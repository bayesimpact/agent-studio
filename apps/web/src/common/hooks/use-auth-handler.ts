import { useAuth0 } from "@auth0/auth0-react"
import { AUTH0_ORGANIZATION_ID } from "@/config/auth0.config"

export function useAuthHandler() {
  const { loginWithRedirect, logout } = useAuth0()

  const handleLogIn = () =>
    loginWithRedirect({
      authorizationParams: {
        organization: AUTH0_ORGANIZATION_ID,
      },
    })

  const handleLogOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }
  return { handleLogOut, handleLogIn }
}
