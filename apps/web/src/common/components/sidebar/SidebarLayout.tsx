import { LayoutHeader } from "@caseai-connect/ui/components/layouts/header"
import { NavUser } from "@caseai-connect/ui/components/layouts/sidebar/NavUser"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import type { Organization } from "@/common/features/organizations/organizations.models"
import {
  MainButton,
  OrganizationSelector,
} from "../../../components/organization/OrganizationSelector"
import { NavUserMenuItems } from "./nav/NavUserMenuItems"
import { SidebarBreadcrumb } from "./SidebarBreadcrumb"

export function SidebarLayout({
  user,
  organization,
  children,
  sidebarContentChildren,
  sidebarFooterChildren,
}: {
  user: User
  organization?: Organization
  children: React.ReactNode
  sidebarContentChildren?: React.ReactNode
  sidebarFooterChildren?: React.ReactNode
}) {
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
          <SidebarMenu>
            <SidebarMenuItem>
              {organization ? <Selector /> : <MainButton organizationName="" onClick={() => {}} />}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>{sidebarContentChildren}</SidebarContent>

        {sidebarFooterChildren}

        <SidebarFooter>
          <NavUser user={user}>
            <NavUserMenuItems />
          </NavUser>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <LayoutHeader
          title={organization ? <SidebarBreadcrumb organization={organization} /> : ""}
        />

        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

function Selector() {
  const { isMobile } = useSidebar()
  return <OrganizationSelector side={isMobile ? "bottom" : "right"} />
}
