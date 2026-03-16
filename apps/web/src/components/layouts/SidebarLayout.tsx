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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import type { Organization } from "@/features/organizations/organizations.models"
import { OrganizationSelector } from "../organization/OrganizationSelector"
import { NavUserMenuItems } from "../sidebar/nav/NavUserMenuItems"
import { SidebarLayoutContext } from "./sidebar/context"
import { SidebarBreadcrumb } from "./sidebar/SidebarBreadcrumb"

export function SidebarLayout({
  user,
  organization,
  children,
  sidebarContentChildren,
  sidebarFooterChildren,
}: {
  user: User
  organization: Organization
  children: React.ReactNode
  sidebarContentChildren: React.ReactNode
  sidebarFooterChildren: React.ReactNode
}) {
  const [headerRightSlot, setHeaderRightSlot] = useState<React.ReactNode>(null)

  return (
    <SidebarLayoutContext.Provider value={{ headerRightSlot, setHeaderRightSlot }}>
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
                <Selector />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>{sidebarContentChildren}</SidebarContent>

          <SidebarFooter>
            {sidebarFooterChildren}

            <NavUser user={user}>
              <NavUserMenuItems />
            </NavUser>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <LayoutHeader
            title={<SidebarBreadcrumb organization={organization} />}
            rightSlot={headerRightSlot}
          />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </SidebarLayoutContext.Provider>
  )
}

function Selector() {
  const { isMobile } = useSidebar()
  return (
    <OrganizationSelector TriggerButton={SidebarMenuButton} side={isMobile ? "bottom" : "right"} />
  )
}
