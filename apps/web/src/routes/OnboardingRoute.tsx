import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectMeStatus } from "@/features/me/me.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildOrganizationPath } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const navigate = useNavigate()
  const meStatus = useAppSelector(selectMeStatus)
  const organizations = useAppSelector(selectOrganizations)

  useEffect(() => {
    // If not authenticated, redirect will be handled by HomeRoute
    if (!authLoading && !isAuthenticated) {
      return
    }

    // If user data is loaded and has organizations, redirect to dashboard
    if (ADS.isFulfilled(meStatus) && organizations && organizations?.length > 0) {
      const organization = organizations[0]
      if (!organization) throw new Error("No organization found")
      navigate(buildOrganizationPath(organization.id), { replace: true })
    }
  }, [isAuthenticated, authLoading, meStatus, organizations, navigate])

  // Show loading while Auth0 is loading or while fetching user data
  if (authLoading || ADS.isLoading(meStatus)) {
    return <LoadingRoute />
  }

  // If not authenticated, this shouldn't render (HomeRoute should redirect)
  if (!isAuthenticated) {
    return null
  }

  // If user data failed to load, show error (could be improved with error UI)
  if (ADS.isError(meStatus)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error loading user data</h1>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  // If user has no organizations, show the create organization form
  if (ADS.isFulfilled(meStatus) && organizations?.length === 0) {
    return <CreateOrganizationForm />
  }

  // Default: show loading (shouldn't reach here normally)
  return <LoadingRoute />
}
