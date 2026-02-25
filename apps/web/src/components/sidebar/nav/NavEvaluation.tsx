import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { ListChecksIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildEvaluationPath } from "@/routes/helpers"

export function NavEvaluation({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { isAdminInterface } = useAbility()
  const isActive = useIsEvaluationActive(projectId)
  if (!isAdminInterface) return null
  const path = buildEvaluationPath({ organizationId, projectId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <ListChecksIcon />
            <span>{t("evaluation:evaluations")}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useIsEvaluationActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/eval`), [location, projectId])
}
