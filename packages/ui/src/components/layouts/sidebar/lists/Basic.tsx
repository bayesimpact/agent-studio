"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shad/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@repo/ui/shad/sidebar"
import { Section } from "../Section"
import { MenuItem } from "../types"

export function BasicList({
  items,
}: {
  items: MenuItem[]
}) {
  const { isMobile } = useSidebar()
  return (
    <Section name="Lorem Ipsum" className="group-data-[collapsible=icon]:hidden">
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align={isMobile ? "end" : "start"}
            >
              <DropdownMenuItem>
                <Folder className="text-muted-foreground" />
                <span>View Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Forward className="text-muted-foreground" />
                <span>Share Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="text-muted-foreground" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ))}
    </Section >
  )
}
