import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { MessageSquareWarningIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildFeedbackPath } from "@/routes/helpers"

export function NavFeedback({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) {
  const { t } = useTranslation("common")
  const { isAdminInterface } = useAbility()
  const isActive = useIsFeedbackActive(agentId)
  if (!isAdminInterface) return null
  const path = buildFeedbackPath({ organizationId, projectId, agentId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <MessageSquareWarningIcon />
            <span>{t("feedback", { cfl: true })}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useIsFeedbackActive(agentId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/a/${agentId}/f`), [location, agentId])
}
