import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { type LucideIcon, PlugZap2Icon } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "../../../lib/utils"

export function Header({
  name = "CaseAi",
  subname,
  Icon = PlugZap2Icon,
  to,
  iconClassName,
}: {
  name?: string
  subname?: string
  Icon?: LucideIcon
  to: string
  iconClassName?: string
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to={to}>
            <div
              className={cn(
                "bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg",
                iconClassName,
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">{name}</span>
              {subname && <span className="">{subname}</span>}
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
