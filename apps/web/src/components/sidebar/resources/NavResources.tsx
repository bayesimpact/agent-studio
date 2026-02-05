import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { DatabaseZapIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildResourcesPath } from "@/routes/helpers"

export function NavResources({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("common")
  const { isAdminInterface } = useAbility()
  const isActive = useIsResourcesActive()
  if (!isAdminInterface) return null
  // TODO: i18n
  const path = buildResourcesPath({ organizationId, projectId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <DatabaseZapIcon />
            <span>{t("resources")}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function useIsResourcesActive() {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith("/r"), [location])
}
