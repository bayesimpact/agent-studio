import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { type LucideIcon, PlugZap2Icon } from "lucide-react"

export function Header({
  name = "CaseAi",
  subname,
  Icon = PlugZap2Icon,
}: {
  name?: string
  subname?: string
  Icon?: LucideIcon
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <a href="https://www.bayesimpact.org">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Icon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">{name}</span>
              {subname && <span className="">{subname}</span>}
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
