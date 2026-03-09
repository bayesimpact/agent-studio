import { BreadcrumbItem, BreadcrumbSeparator } from "@caseai-connect/ui/shad/breadcrumb"
import { DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useIsRoute } from "@/hooks/use-is-route"
import { RouteNames } from "@/routes/helpers"

export function BreadcrumbDocuments() {
  const { isRoute } = useIsRoute()
  const isDocumentsRoute = isRoute(RouteNames.DOCUMENTS)
  const { t } = useTranslation("document")
  if (!isDocumentsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("documents")}</BreadcrumbItem>
    </>
  )
}
