import { useAuth0 } from "@auth0/auth0-react"
import { LoadingRoute } from "./LoadingRoute"

export function LoginRoute() {
  const { loginWithRedirect } = useAuth0()
  loginWithRedirect()
  return <LoadingRoute />
}
