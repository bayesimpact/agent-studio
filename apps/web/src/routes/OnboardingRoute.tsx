import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizations)
  const { buildPath } = useBuildPath()
  const firstOrganization = organizations?.[0]

  useEffect(() => {
    if (!firstOrganization) return

    const path = buildPath("organization", { organizationId: firstOrganization.id })
    navigate(path, { replace: true })
  }, [firstOrganization, navigate, buildPath])

  if (organizations?.length === 0) {
    return <CreateOrganizationForm />
  }

  return <LoadingRoute />
}
