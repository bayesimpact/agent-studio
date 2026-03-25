import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { UsersIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildAgentMembershipsPath } from "@/routes/helpers"

export function NavAgentMemberships({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) {
  const { t } = useTranslation()
  const { isAdminInterface } = useAbility()
  const isActive = useIsAgentMembershipsActive(agentId)
  if (!isAdminInterface) return null
  const path = buildAgentMembershipsPath({ organizationId, projectId, agentId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <UsersIcon />
          <span>{t("agentMembership:members")}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function useIsAgentMembershipsActive(agentId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/a/${agentId}/members`), [location, agentId])
}
