import { Dashboard } from "@/components/Dashboard";
import { LoadingRoute } from "@/routes/LoadingRoute";
import { toUser } from "@/utils/to-user";
import { useAuth0 } from "@auth0/auth0-react";
import { NotFoundRoute } from "./NotFoundRoute";

export function DashboardRoute() {
  const { user: userDto, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingRoute />

  if (isAuthenticated && userDto) return <Dashboard user={toUser(userDto)} />
  return <NotFoundRoute />
}
