import { OrganizationCreator } from "@/components/organization/OrganizationCreator"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const organizations = useAppSelector(selectOrganizationsData)

  if (ADS.isFulfilled(organizations) && organizations.value.length === 0) {
    return <OrganizationCreator />
  }
  // FIXME: navigate to lobby

  return <LoadingRoute />
}
