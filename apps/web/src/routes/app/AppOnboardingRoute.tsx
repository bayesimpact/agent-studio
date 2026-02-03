import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"

export function AppOnboardingRoute() {
  const navigate = useNavigate()
  const organizationsData = useAppSelector(selectOrganizationsData)
  const { buildPath } = useBuildPath()

  useEffect(() => {
    if (!ADS.isFulfilled(organizationsData)) return
    if (organizationsData.value.length === 0) return

    const organization = organizationsData.value[0] // First organization
    if (!organization) throw new Error("No organization found")

    const path = buildPath("organization", { organizationId: organization.id })
    navigate(path, { replace: true })
  }, [organizationsData, navigate, buildPath])

  if (ADS.isFulfilled(organizationsData) && organizationsData.value.length === 0) {
    return <CreateOrganizationForm />
  }

  return <LoadingRoute />
}
