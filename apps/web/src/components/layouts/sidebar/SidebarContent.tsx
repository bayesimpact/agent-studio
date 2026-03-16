import { AdminNavProject, AppNavProject } from "@/components/sidebar/nav/NavProject"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"

export function SidebarContent({
  isAdminInterface,
  project,
  projects,
  organization,
}: {
  isAdminInterface: boolean
  project: Project
  projects: Project[]
  organization: Organization
}) {
  if (isAdminInterface)
    return (
      <AdminNavProject organizationId={organization.id} project={project} projects={projects} />
    )
  return <AppNavProject organizationId={organization.id} project={project} projects={projects} />
}
