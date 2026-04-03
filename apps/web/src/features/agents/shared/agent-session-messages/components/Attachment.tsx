import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon, PaperclipIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { useAppDispatch } from "@/store/hooks"
import { getDocumentTemporaryUrl } from "@/studio/features/documents/documents.thunks"

export function Attachment({ message }: { message: AgentSessionMessage }) {
  const { t } = useTranslation("agentSessionMessage")
  const dispatch = useAppDispatch()

  const [url, setUrl] = useState<string>()

  const loadDocument = useCallback(async () => {
    if (!message.documentId) return
    const res = await dispatch(getDocumentTemporaryUrl({ documentId: message.documentId })).unwrap() // FIXME: onSuccess callback
    if (res.url) setUrl(res.url)
  }, [dispatch, message.documentId])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  if (!message.documentId) return null
  return (
    <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")} disabled={!url}>
      <PaperclipIcon className="size-4" /> {t("attachment")}
      <ExternalLinkIcon className="size-4" />
    </Button>
  )
}
