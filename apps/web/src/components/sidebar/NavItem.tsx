"use client"

import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { Link } from "react-router-dom"
import type { MenuItem } from "./types"

export function AppNavItem({
  item,
  itemOptions,
  children,
}: {
  item: MenuItem
  itemOptions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>

          {itemOptions}
        </Link>
      </SidebarMenuButton>

      {children}
    </SidebarMenuItem>
  )
}
