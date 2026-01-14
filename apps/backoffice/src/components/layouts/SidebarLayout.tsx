import { LayoutHeader } from "@repo/ui/components/layouts/header"
import { Header } from "@repo/ui/components/layouts/sidebar/Header"
import { NavUser } from "@repo/ui/components/layouts/sidebar/NavUser"
import type { User } from "@repo/ui/components/layouts/sidebar/types"
import { Button } from "@repo/ui/shad/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@repo/ui/shad/sidebar"
import { dataset } from "@/assets/data"
import { NavPrompts } from "../sidebar/NavPrompts"
import { NavSettings } from "../sidebar/NavSettings"
import { NavSources } from "../sidebar/NavSources"
import { NavUserMenuItems } from "../sidebar/NavUserMenuItems"

export function SidebarLayout({ user, children }: { user: User; children: React.ReactNode }) {
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
          <Header />
        </SidebarHeader>

        <SidebarContent>
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
          title="Dashboard"
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
