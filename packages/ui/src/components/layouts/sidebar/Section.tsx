import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@caseai-connect/ui/shad/sidebar"

export function Section({
  name,
  className,
  children,
}: {
  name?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <SidebarGroup className={className}>
      {name && <SidebarGroupLabel className="capitalize">{name}</SidebarGroupLabel>}

      <SidebarMenu>{children}</SidebarMenu>
    </SidebarGroup>
  )
}
