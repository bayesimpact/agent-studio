import { useAuthHandler } from "@/hooks/use-auth-handler";
import { LayoutHeader } from "@repo/ui/components/layouts/header";
import { Header } from "@repo/ui/components/layouts/sidebar/Header";
import { NavUser } from "@repo/ui/components/layouts/sidebar/NavUser";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from "@repo/ui/shad/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider } from "@repo/ui/shad/sidebar";
import { BadgeCheckIcon, BellIcon, CreditCardIcon, LogOutIcon, SparklesIcon } from "lucide-react";

type User = {
  name: string,
  email: string,
  avatar?: string
}

export function SidebarLayout({ user, children }: {
  user: User,
  children: React.ReactNode
}) {

  return <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
  >
    <Sidebar variant="inset" collapsible="offcanvas" >
      <SidebarHeader>
        <Header />
      </SidebarHeader>

      <SidebarContent>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} >
          <NavUserMenuItems />
        </NavUser>
      </SidebarFooter>
    </Sidebar>

    <SidebarInset>
      <LayoutHeader />

      <>{children}</>
    </SidebarInset>
  </SidebarProvider>
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
