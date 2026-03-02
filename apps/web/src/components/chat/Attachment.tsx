import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon, PaperclipIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ConversationAgentSessionMessage } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { getDocumentTemporaryUrl } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"

export function Attachment({ message }: { message: ConversationAgentSessionMessage }) {
  const { t } = useTranslation("agentSessionMessage")
  const dispatch = useAppDispatch()

  const [url, setUrl] = useState<string>()

  const loadDocument = useCallback(async () => {
    if (!message.documentId) return
    const res = await dispatch(getDocumentTemporaryUrl({ documentId: message.documentId })).unwrap()
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
