import { Section } from "@repo/ui/components/layouts/sidebar/Section"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@repo/ui/shad/sidebar"
import type { MenuItem } from "./types"

export function NavSettings({ items, }: { items: MenuItem[], }) {
  return <Section name="Settings">
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url} className="font-medium">
              {item.title}
            </a>
          </SidebarMenuButton>
          {item.items?.length ? (
            <SidebarMenuSub>
              {item.items.map((item) => (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton asChild isActive={item.isActive}>
                    <a href={item.url}>{item.title}</a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </Section>
}
