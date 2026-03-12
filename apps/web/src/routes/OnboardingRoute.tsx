import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizationsData)
  const { buildPath } = useBuildPath()

  useEffect(() => {
    if (!ADS.isFulfilled(organizations) || !organizations.value[0]) return

    const path = buildPath("organization", { organizationId: organizations.value[0].id })
    navigate(path, { replace: true })
  }, [organizations, navigate, buildPath])

  if (ADS.isFulfilled(organizations) && organizations.value.length === 0) {
    return <CreateOrganizationForm />
  }

  return <LoadingRoute />
}
