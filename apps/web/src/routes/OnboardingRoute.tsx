import { useEffect } from "react"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useNavigateToFirstOrganization } from "@/hooks/use-navigate-to-first-organization"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const organizations = useAppSelector(selectOrganizationsData)
  const { navigateToFirstOrganization } = useNavigateToFirstOrganization()

  useEffect(() => {
    navigateToFirstOrganization({ organizations })
  }, [organizations, navigateToFirstOrganization])

  if (ADS.isFulfilled(organizations) && organizations.value.length === 0) {
    return <CreateOrganizationForm />
  }

  return <LoadingRoute />
}
