import { useEffect } from "react"
import { selectMe } from "@/features/me/me.selectors"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useNavigateToFirstOrganization } from "@/hooks/use-navigate-to-first-organization"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const organizations = useAppSelector(selectOrganizationsData)
  const { navigateToFirstOrganization } = useNavigateToFirstOrganization()

  const me = useAppSelector(selectMe)
  useEffect(() => {
    navigateToFirstOrganization({ organizations })
  }, [organizations, navigateToFirstOrganization])

  if (ADS.isFulfilled(organizations) && organizations.value.length === 0) {
    return <div>Bonjour {me?.value?.name}</div>
    // return <OrganizationCreator />
  }

  return <LoadingRoute />
}
