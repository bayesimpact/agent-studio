import { useAuth0 } from "@auth0/auth0-react";
import { LoadingRoute } from "./LoadingRoute";

export function LogoutRoute() {
  const { logout } = useAuth0()
  logout({ logoutParams: { returnTo: window.location.origin } })
  return <LoadingRoute />
}
