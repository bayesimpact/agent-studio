import { LayoutHeader } from "@caseai-connect/ui/components/layouts/header"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { NavUser } from "@caseai-connect/ui/components/layouts/sidebar/NavUser"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@caseai-connect/ui/shad/sidebar"
import { dataset } from "@/assets/data"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { useAppSelector } from "@/store/hooks"
import { NavProjects } from "../sidebar/NavProjects"
import { NavPrompts } from "../sidebar/NavPrompts"
import { NavSettings } from "../sidebar/NavSettings"
import { NavSources } from "../sidebar/NavSources"
import { NavUserMenuItems } from "../sidebar/NavUserMenuItems"

export function SidebarLayout({
  user,
  children,
  headerTitle,
}: {
  user: User
  children: React.ReactNode
  headerTitle?: string
}) {
  const organizations = useAppSelector(selectOrganizations)
  // Use the first organization's name, or fall back to "CaseAi" if no organizations
  const organizationName =
    organizations.length > 0 && organizations[0] ? organizations[0].name : "CaseAi"

  return (
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
          <Header name={organizationName} />
        </SidebarHeader>

        <SidebarContent>
          <NavProjects />

          <NavSources items={dataset.sources} />

          <NavPrompts items={dataset.prompts} />

          <NavSettings items={dataset.expandedList} />
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={user}>
            <NavUserMenuItems />
          </NavUser>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <LayoutHeader
          title={headerTitle || "Dashboard"}
          rightSlot={
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://www.bayesimpact.org"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                Todo
              </a>
            </Button>
          }
        />

        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
