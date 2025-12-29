import { dataset } from "@repo/ui/assets/data"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@repo/ui/shad/sidebar"
import type * as React from "react"
import { Header } from "./sidebar/Header"
import { BasicList } from "./sidebar/lists/Basic"
import { CollapsibleList } from "./sidebar/lists/Collapsible"
import { ExpandedList } from "./sidebar/lists/Expanded"
import { NavUser } from "./sidebar/NavUser"
import type { User } from "./sidebar/types"

export function AppSidebar({
  footerChildren,
  navUserDropdownMenuChildren,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  footerChildren?: React.ReactNode
  navUserDropdownMenuChildren?: React.ReactNode
} & { user: User }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <Header />
      </SidebarHeader>

      <SidebarContent>
        <BasicList items={dataset.basicList} />
        <CollapsibleList items={dataset.collapsibleList} />
        <ExpandedList items={dataset.expandedList} />
      </SidebarContent>

      <SidebarFooter>
        <>{footerChildren}</>

        <NavUser user={user}>
          <>{navUserDropdownMenuChildren}</>
        </NavUser>
      </SidebarFooter>
    </Sidebar>
  )
}
