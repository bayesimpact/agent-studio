import { useAuth0 } from "@auth0/auth0-react"

export function useAuthHandler() {
  const { loginWithRedirect, logout } = useAuth0()

  const handleLogIn = () => loginWithRedirect()

  const handleLogOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }
  return { handleLogOut, handleLogIn }
}
