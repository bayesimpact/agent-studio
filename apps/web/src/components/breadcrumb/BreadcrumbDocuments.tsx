import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { GitCommitHorizontalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useIsRoute } from "@/hooks/use-is-route"
import { StudioRouteNames } from "@/studio/routes/helpers"

export function BreadcrumbDocuments() {
  const { isRoute } = useIsRoute()
  const isDocumentsRoute = isRoute(StudioRouteNames.DOCUMENTS)
  const { t } = useTranslation("document")
  if (!isDocumentsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <GitCommitHorizontalIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("documents")}</BreadcrumbItem>
    </>
  )
}
