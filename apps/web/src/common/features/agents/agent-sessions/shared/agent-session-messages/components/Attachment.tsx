import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon, PaperclipIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import { useAppDispatch } from "@/common/store/hooks"
import { getAttachmentDocumentTemporaryUrl } from "../agent-session-messages.thunks"

export function Attachment({ message }: { message: AgentSessionMessage }) {
  const { t } = useTranslation("agentSessionMessage")
  const dispatch = useAppDispatch()

  const [url, setUrl] = useState<string>()

  const loadDocument = useCallback(async () => {
    const attachmentDocumentId = message.attachmentDocumentId

    if (!attachmentDocumentId) return

    const res = await dispatch(getAttachmentDocumentTemporaryUrl({ attachmentDocumentId })).unwrap()
    if (res?.url) setUrl(res.url)
  }, [dispatch, message.attachmentDocumentId])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  if (!message.attachmentDocumentId) return null
  return (
    <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")} disabled={!url}>
      <PaperclipIcon className="size-4" /> {t("attachment")}
      <ExternalLinkIcon className="size-4" />
    </Button>
  )
}
