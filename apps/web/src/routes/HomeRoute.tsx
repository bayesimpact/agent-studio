import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function HomeRoute() {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const organizations = useAppSelector(selectOrganizationsData)

  useEffect(() => {
    if (isLoading) return

    if (!ADS.isUninitialized(organizations) && !isAuthenticated) {
      // User is not authenticated, redirect to Auth0 login
      loginWithRedirect()
      return
    }

    if (isAuthenticated) {
      const firstOrganization = organizations?.value?.[0]

      const path = firstOrganization
        ? buildPath("organization", { organizationId: firstOrganization.id })
        : buildPath("onboarding", {})
      navigate(path, { replace: true })
    } else {
      // User is not authenticated, redirect to Auth0 login
      loginWithRedirect()
    }
  }, [isLoading, buildPath, organizations, isAuthenticated, navigate, loginWithRedirect])

  return <LoadingRoute />
}
