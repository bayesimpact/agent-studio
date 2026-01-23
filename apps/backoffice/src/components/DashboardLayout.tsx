import type { ProjectDto } from "@caseai-connect/api-contracts"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Outlet } from "react-router-dom"
import { SidebarLayout } from "./layouts/SidebarLayout"

export function DashboardLayout({
  user,
  projects,
  organizationId,
}: {
  user: User
  projects: ProjectDto[]
  organizationId?: string
}) {
  if (organizationId)
    return (
      <SidebarLayout organizationId={organizationId} user={user} projects={projects}>
        <Outlet />
      </SidebarLayout>
    )
  return <Outlet />
}
