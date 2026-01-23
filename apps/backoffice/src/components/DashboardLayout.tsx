import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Outlet } from "react-router-dom"
import { SidebarLayout } from "./layouts/SidebarLayout"

export function DashboardLayout({ user }: { user: User }) {
  return (
    <SidebarLayout user={user}>
      <Outlet />
    </SidebarLayout>
  )
}
