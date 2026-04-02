import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useIsRoute } from "@/hooks/use-is-route"
import { RouteNames } from "@/routes/helpers"

export function BreadcrumbAnalytics() {
  const { isRoute } = useIsRoute()
  const isAnalyticsRoute = isRoute(RouteNames.ANALYTICS)
  const { t } = useTranslation("analytics")
  if (!isAnalyticsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("title")}</BreadcrumbItem>
    </>
  )
}
