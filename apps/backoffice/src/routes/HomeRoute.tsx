import { Lobby } from "@/components/Lobby";
import { useAuth0 } from "@auth0/auth0-react";
import { LoadingRoute } from "./LoadingRoute";

export function HomeRoute() {
  const { user, isLoading, isAuthenticated } = useAuth0()

  if (isLoading) return <LoadingRoute />

  // @ts-expect-error ignore User type issue from auth0
  return <Lobby user={user} isAuthenticated={isAuthenticated} />
}
