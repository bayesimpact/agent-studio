
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@repo/ui/shad/sidebar"
import { PlugZap2Icon } from "lucide-react"

export function Header() {
  return <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg" asChild>
        <a href="#">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <PlugZap2Icon className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">CaseAi</span>
            <span className="">Connect</span>
          </div>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>

}
