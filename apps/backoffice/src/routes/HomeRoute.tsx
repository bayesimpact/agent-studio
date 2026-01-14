import { useAuth0 } from "@auth0/auth0-react"
import { Lobby } from "@/components/Lobby"
import { toUser } from "@/utils/to-user"
import { LoadingRoute } from "./LoadingRoute"

export function HomeRoute() {
  const { user: userDto, isLoading, isAuthenticated } = useAuth0()

  if (isLoading) return <LoadingRoute />

  return <Lobby user={userDto ? toUser(userDto) : undefined} isAuthenticated={isAuthenticated} />
}
