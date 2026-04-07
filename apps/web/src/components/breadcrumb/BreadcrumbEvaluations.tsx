import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useIsRoute } from "@/hooks/use-is-route"
import { StudioRouteNames } from "@/studio/routes/helpers"

export function BreadcrumbEvaluations() {
  const { isRoute } = useIsRoute()
  const isEvaluationRoute = isRoute(StudioRouteNames.EVALUATION)
  const { t } = useTranslation("evaluation")
  if (!isEvaluationRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("evaluation")}</BreadcrumbItem>
    </>
  )
}
