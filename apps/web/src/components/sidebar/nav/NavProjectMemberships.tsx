import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { UsersIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildProjectMembershipsPath } from "@/routes/helpers"

export function NavProjectMemberships({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { isAdminInterface } = useAbility()
  const isActive = useIsProjectMembershipsActive(projectId)
  if (!isAdminInterface) return null
  const path = buildProjectMembershipsPath({ organizationId, projectId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <UsersIcon />
            <span>{t("projectMembership:members")}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useIsProjectMembershipsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/members`), [location, projectId])
}
