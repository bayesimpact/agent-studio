import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon, PaperclipIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { AgentSessionMessage } from "@/features/agent-sessions/agent-sessions.models"
import { getDocumentTemporaryUrl } from "@/features/documents/documents.thunks"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function Attachment({ message }: { message: AgentSessionMessage }) {
  const { t } = useTranslation("common")
  const dispatch = useAppDispatch()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const [url, setUrl] = useState<string>()

  const loadDocument = useCallback(async () => {
    if (!message.documentId || !organizationId || !projectId) return
    const res = await dispatch(
      getDocumentTemporaryUrl({ documentId: message.documentId, organizationId, projectId }),
    ).unwrap()
    if (res.url) setUrl(res.url)
  }, [dispatch, message.documentId, organizationId, projectId])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  if (!message.documentId) return null
  return (
    <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")} disabled={!url}>
      <PaperclipIcon className="size-4" /> {t("viewAttachment")}
      <ExternalLinkIcon className="size-4" />
    </Button>
  )
}
