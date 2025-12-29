import { useAuthHandler } from "@/hooks/use-auth-handler";
import { LoadingRoute } from "@/routes/LoadingRoute";
import { useAuth0 } from "@auth0/auth0-react";
import { LayoutHeader } from "@repo/ui/components/layouts/header";
import { AppSidebar } from "@repo/ui/components/layouts/sidebar";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from "@repo/ui/shad/dropdown-menu";
import { SidebarInset, SidebarProvider } from "@repo/ui/shad/sidebar";
import { BadgeCheckIcon, BellIcon, CreditCardIcon, LogOutIcon, SparklesIcon } from "lucide-react";

export function DashboardRoute() {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingRoute />

  if (isAuthenticated && user) return <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
  >
    <AppSidebar variant="inset" navUserDropdownMenuChildren={<NavUserMenuItems />} user={{
      name: user.name || user.nickname || user.email || 'User',
      email: user.email || '',
      avatar: user.picture || ''
    }} />

    <SidebarInset>
      <LayoutHeader />

      <div className="flex flex-1 flex-col">
        {/* <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              SectionCards
              <div className="px-4 lg:px-6">
                ChartAreaInteractive
              </div>
              DataTable
            </div>
          </div> */}
      </div>
    </SidebarInset>
  </SidebarProvider>
  return null
}


function NavUserMenuItems() {
  const { handleLogOut } = useAuthHandler()
  return <>
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <SparklesIcon />
        Upgrade to Pro
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <BadgeCheckIcon />
        Account
      </DropdownMenuItem>
      <DropdownMenuItem>
        <CreditCardIcon />
        Billing
      </DropdownMenuItem>
      <DropdownMenuItem>
        <BellIcon />
        Notifications
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleLogOut}>
      <LogOutIcon />
      Log out
    </DropdownMenuItem></>
}
