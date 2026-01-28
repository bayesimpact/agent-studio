import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildOrganizationPath } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const navigate = useNavigate()
  const organizationsData = useAppSelector(selectOrganizationsData)

  useEffect(() => {
    if (!ADS.isFulfilled(organizationsData)) return
    if (organizationsData.value.length === 0) return

    const organization = organizationsData.value[0] // First organization
    if (!organization) throw new Error("No organization found")
    navigate(buildOrganizationPath(organization.id), { replace: true })
  }, [organizationsData, navigate])

  if (ADS.isFulfilled(organizationsData) && organizationsData.value.length === 0) {
    return <CreateOrganizationForm />
  }

  return <LoadingRoute />
}
