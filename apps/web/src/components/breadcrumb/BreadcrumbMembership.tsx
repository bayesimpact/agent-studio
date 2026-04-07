import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useIsRoute } from "@/hooks/use-is-route"
import { StudioRouteNames } from "@/studio/routes/helpers"

export function BreadcrumbMembership() {
  const { isRoute } = useIsRoute()
  const isProjectMembershipsRoute = isRoute(StudioRouteNames.PROJECT_MEMBERSHIPS)
  const { t } = useTranslation("projectMembership")
  if (!isProjectMembershipsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("members")}</BreadcrumbItem>
    </>
  )
}
