import type { ProjectDto } from "@caseai-connect/api-contracts"
import { LayoutHeader } from "@caseai-connect/ui/components/layouts/header"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { NavUser } from "@caseai-connect/ui/components/layouts/sidebar/NavUser"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { RouteNames } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { NavProjects } from "../sidebar/NavProjects"
import { NavUserMenuItems } from "../sidebar/NavUserMenuItems"
import { SidebarLayoutContext } from "./sidebar/context"

export function SidebarLayout({
  user,
  projects,
  children,
  organizationId,
}: {
  user: User
  projects: ProjectDto[]
  children: React.ReactNode
  organizationId: string
}) {
  const [headerTitle, setHeaderTitle] = useState("Dashboard")

  const organizations = useAppSelector(selectOrganizations)
  // Use the first organization's name, or fall back to "CaseAi" if no organizations
  const organizationName =
    organizations.length > 0 && organizations[0] ? organizations[0].name : "CaseAi"

  return (
    <SidebarLayoutContext.Provider value={{ headerTitle, setHeaderTitle }}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <Sidebar variant="inset" collapsible="offcanvas">
          <SidebarHeader>
            <Header to={RouteNames.HOME} name={organizationName} />
          </SidebarHeader>

          <SidebarContent>
            <NavProjects projects={projects} organizationId={organizationId} />
          </SidebarContent>

          <SidebarFooter>
            <NavUser user={user}>
              <NavUserMenuItems />
            </NavUser>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <LayoutHeader title={headerTitle} />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </SidebarLayoutContext.Provider>
  )
}
