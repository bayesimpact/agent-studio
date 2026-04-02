import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { BarChart3Icon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildAnalyticsPath } from "@/routes/helpers"

export function NavAnalytics({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("analytics")
  const { isAdminInterface } = useAbility()
  const isActive = useIsAnalyticsActive(projectId)

  if (!isAdminInterface) return null

  const path = buildAnalyticsPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <BarChart3Icon className="size-4" />
          <span className="capitalize-first">{t("title")}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function useIsAnalyticsActive(projectId: string) {
  const location = useLocation()
  return useMemo(
    () => location.pathname.endsWith(`/p/${projectId}/analytics`),
    [location.pathname, projectId],
  )
}
