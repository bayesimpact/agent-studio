import { useAuth0 } from "@auth0/auth0-react";

export function LoginRoute() {
  const { loginWithRedirect } = useAuth0()
  loginWithRedirect()
  return <LoginRoute />
}
