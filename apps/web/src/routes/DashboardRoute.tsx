import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { selectMe, selectMeStatus } from "@/features/me/me.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"

export function DashboardRoute() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const projects = useAppSelector(selectProjects)
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizations)
  const meStatus = useAppSelector(selectMeStatus)
  const meUser = useAppSelector(selectMe)
  const user = meStateToUser(meUser)

  useEffect(() => {
    // If user data is loaded and has no organizations, redirect to onboarding
    if (meStatus === "succeeded" && organizations.length === 0) {
      navigate("/onboarding", { replace: true })
    }
  }, [meStatus, organizations, navigate])

  if (meStatus === "loading") return <LoadingRoute />

  if (projects && user && organizations.length > 0) {
    return <DashboardLayout organizationId={organizationId} user={user} projects={projects} />
  }

  // Show loading while redirecting
  return <LoadingRoute />
}
