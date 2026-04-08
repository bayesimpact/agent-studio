import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useIsRoute } from "@/hooks/use-is-route"
import { StudioRouteNames } from "@/studio/routes/helpers"

export function BreadcrumbAnalytics() {
  const { hasFeature } = useFeatureFlags()
  const { isRoute } = useIsRoute()
  const isAnalyticsRoute = isRoute(StudioRouteNames.ANALYTICS)
  const { t } = useTranslation()
  if (!hasFeature("project-analytics") || !isAnalyticsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem className="capitalize">{t("analytics:analytics")}</BreadcrumbItem>
    </>
  )
}
