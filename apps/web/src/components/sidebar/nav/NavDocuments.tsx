import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { CheckCheck, CloudAlertIcon, DatabaseZapIcon, Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { selectUploaderState } from "@/features/documents/documents.selectors"
import { useAbility } from "@/hooks/use-ability"
import { buildDocumentsPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"

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
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <div className="flex flex-1 gap-2 items-center">
              <DatabaseZapIcon className="size-4" />
              <span className="capitalize-first">{t("document:documents")}</span>
            </div>
            <UploaderState />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  const wrap = (content: React.ReactNode) => (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">{content}</div>
  )
  switch (uploaderState.status) {
    case "uploading":
      return wrap(
        <>
          <Loader2 className="animate-spin size-4" />
          <span className="text-xs text-muted-foreground">
            {uploaderState.completed}/{uploaderState.total}
          </span>
        </>,
      )

    case "error":
      return wrap(
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon-sm" variant="destructive">
              <CloudAlertIcon className="animate-bounce" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              {/* // FIXME: 18n */}
              <DialogTitle>Error uploading documents:</DialogTitle>
            </DialogHeader>

            {uploaderState.errors?.join(", ")}
          </DialogContent>
        </Dialog>,
      )

    case "completed":
      return wrap(<CheckCheck className="size-4 text-green-500" />)
    default:
      return null
  }
}

function useIsDocumentsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/d`), [location, projectId])
}
