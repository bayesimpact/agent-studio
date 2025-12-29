import { useAuthHandler } from "@/hooks/use-auth-handler";
import { LayoutHeader } from "@repo/ui/components/layouts/header";
import { AppSidebar } from "@repo/ui/components/layouts/sidebar";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from "@repo/ui/shad/dropdown-menu";
import { SidebarInset, SidebarProvider } from "@repo/ui/shad/sidebar";
import { BadgeCheckIcon, BellIcon, CreditCardIcon, LogOutIcon, SparklesIcon } from "lucide-react";

type User = {
  name: string,
  email: string,
  avatar?: string
}

export function Dashboard({ user }: {
  user: User
}) {

  return <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
  >
    <AppSidebar variant="inset" navUserDropdownMenuChildren={<NavUserMenuItems />} user={user} />

    <SidebarInset>
      <LayoutHeader />

      <div className="flex flex-1 flex-col">
        {/* // TODO: */}
      </div>
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
