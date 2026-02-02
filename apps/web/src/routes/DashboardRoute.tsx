import { DashboardLayout } from "@/components/DashboardLayout"
import type { User } from "@/features/me/me.models"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"

export function DashboardRoute({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  return <DashboardLayout user={user} projects={projects} organization={organization} />
}
