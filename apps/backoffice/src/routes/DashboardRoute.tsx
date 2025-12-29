import { Dashboard } from "@/components/Dashboard";
import { LoadingRoute } from "@/routes/LoadingRoute";
import { useAuth0 } from "@auth0/auth0-react";
import { NotFoundRoute } from "./NotFoundRoute";

export function DashboardRoute() {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingRoute />

  // @ts-expect-error - ignore user type from auth0
  if (isAuthenticated && user) return <Dashboard user={user} />

  return <NotFoundRoute />
}
