import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { DatabaseZapIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildDocumentsPath } from "@/routes/helpers"

export function NavDocuments({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("common")
  const { isAdminInterface } = useAbility()
  const isActive = useIsDocumentsActive(projectId)
  if (!isAdminInterface) return null
  const path = buildDocumentsPath({ organizationId, projectId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <DatabaseZapIcon />
            <span>{t("documents")}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useIsDocumentsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/r`), [location, projectId])
}
