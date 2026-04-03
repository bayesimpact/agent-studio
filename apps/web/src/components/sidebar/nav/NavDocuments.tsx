import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { CloudAlertIcon, DatabaseZapIcon, Loader2Icon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { buildDocumentsPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { selectUploaderState } from "@/studio/features/documents/documents.selectors"

export function NavDocuments({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { isAdminInterface } = useAbility()
  const isActive = useIsDocumentsActive(projectId)

  if (!isAdminInterface) return null
  const path = buildDocumentsPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <div className="flex flex-1 gap-2 items-center">
            <DatabaseZapIcon className="size-4" />
            <span className="capitalize-first">{t("document:documents")}</span>
          </div>
          <UploaderState />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      {uploaderState.status === "uploading" && (
        <>
          <Loader2Icon className="animate-spin size-4" />
          <span className="text-xs text-muted-foreground">
            {uploaderState.processed}/{uploaderState.total}
          </span>
        </>
      )}

      {uploaderState.errors && uploaderState.errors.length > 0 && (
        <CloudAlertIcon className="text-destructive size-5 animate-pulse" />
      )}
    </div>
  )
}

function useIsDocumentsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/d`), [location, projectId])
}
