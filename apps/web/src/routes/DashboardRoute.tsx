import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"

export function DashboardRoute({ user }: { user: User }) {
  const { organizationId } = useParams<{ organizationId: string }>()
  const projects = useAppSelector(selectProjects)

  if (projects && user) {
    return <DashboardLayout organizationId={organizationId} user={user} projects={projects} />
  }

  // Show loading while redirecting
  return <LoadingRoute />
}
