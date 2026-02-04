import { LayoutHeader } from "@caseai-connect/ui/components/layouts/header"
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
import { useCallback, useState } from "react"
import { NavUserMenuItems } from "../sidebar/NavUserMenuItems"
import { SidebarLayoutContext } from "./sidebar/context"

export function SidebarLayout({
  user,
  children,
  sidebarHeaderChildren,
  sidebarContentChildren,
}: {
  user: User
  children: React.ReactNode
  sidebarHeaderChildren: React.ReactNode
  sidebarContentChildren: React.ReactNode
}) {
  const [headerTitle, setHeaderTitle] = useState("Dashboard")
  const [headerRightSlot, setHeaderRightSlot] = useState<React.ReactNode>(null)

  const handleSetHeaderTitle = useCallback((title: string) => {
    if (title.trim().length === 0) {
      title = "Dashboard"
    }
    setHeaderTitle(title)
  }, [])

  return (
    <SidebarLayoutContext.Provider
      value={{
        headerTitle,
        setHeaderTitle: handleSetHeaderTitle,
        headerRightSlot,
        setHeaderRightSlot,
      }}
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <Sidebar variant="inset" collapsible="offcanvas">
          <SidebarHeader>{sidebarHeaderChildren}</SidebarHeader>

          <SidebarContent>{sidebarContentChildren}</SidebarContent>

          <SidebarFooter>
            <NavUser user={user}>
              <NavUserMenuItems />
            </NavUser>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <LayoutHeader title={headerTitle} rightSlot={headerRightSlot} />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </SidebarLayoutContext.Provider>
  )
}
