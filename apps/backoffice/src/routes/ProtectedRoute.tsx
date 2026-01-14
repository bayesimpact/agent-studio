import { useAuth0 } from "@auth0/auth0-react"
import { Navigate } from "react-router-dom"
import { LoadingRoute } from "./LoadingRoute"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return <LoadingRoute />
  return isAuthenticated ? children : <Navigate to="/" />
}
