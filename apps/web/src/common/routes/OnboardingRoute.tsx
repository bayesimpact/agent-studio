import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { OrganizationCreator } from "@/components/organization/OrganizationCreator"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const organizations = useAppSelector(selectOrganizationsData)

  if (ADS.isFulfilled(organizations) && organizations.value.length === 0) {
    return <OrganizationCreator />
  }
  // FIXME: navigate to lobby

  return <LoadingRoute />
}
