import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@repo/ui/shad/sidebar";

export function Section({ name, className, children }: { name: string, className?: string, children: React.ReactNode }) {
  return <SidebarGroup className={className}>
    <SidebarGroupLabel>{name}</SidebarGroupLabel>

    <SidebarMenu>{children}</SidebarMenu>
  </SidebarGroup>
}
