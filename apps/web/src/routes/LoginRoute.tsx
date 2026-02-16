import { useAuth0 } from "@auth0/auth0-react"
import { AUTH0_ORGANIZATION_ID } from "@/config/auth0.config"
import { LoadingRoute } from "./LoadingRoute"

export function LoginRoute() {
  const { loginWithRedirect } = useAuth0()
  loginWithRedirect({
    authorizationParams: {
      organization: AUTH0_ORGANIZATION_ID,
    },
  })
  return <LoadingRoute />
}
