import { DashboardLayout } from "@/components/DashboardLayout"
import type { User } from "@/features/me/me.models"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"

export function DashboardRoute({ user }: { user: User }) {
  const projects = useAppSelector(selectProjects)

  if (projects && user) {
    return <DashboardLayout user={user} projects={projects} />
  }

  return <LoadingRoute />
}
