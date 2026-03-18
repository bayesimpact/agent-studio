import { Spinner } from "@caseai-connect/ui/shad/spinner"
import { cn } from "@caseai-connect/ui/utils"
import { AlertCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FeedbackCreator } from "@/components/agent-message-feedback/FeedbackCreator"
import type { AgentSessionMessage as AgentSessionMessageType } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { Attachment } from "./Attachment"
import { ChatBotMessage, ChatUserMessage } from "./Chat"
import { MarkdownWrapper } from "./MarkdownWrapper"

export function AgentSessionMessage({ message }: { message: AgentSessionMessageType }) {
  switch (message.role) {
    case "assistant": {
      const isStreaming = message.status === "streaming"
      const isError = message.status === "error"
      return (
        <div key={message.id} className="max-w-3/4 relative">
          <ChatBotMessage
            className={cn("pb-8", isError && "bg-red-50 border border-red-200 text-red-800")}
          >
            {isStreaming && <ThinkingMessage />}
            {isError && <ErrorMessage />}

            <MarkdownWrapper content={message.content} />
          </ChatBotMessage>

          <FeedbackCreator message={message} />
        </div>
      )
    }
    case "user":
      return (
        <div className="flex flex-col gap-2 items-end">
          <ChatUserMessage key={message.id}>{message.content}</ChatUserMessage>
          <Attachment message={message} />
        </div>
      )

    default:
      return null
  }
}

function ErrorMessage() {
  const { t } = useTranslation("status")
  return (
    <div className="flex items-center gap-2 mb-2">
      <AlertCircleIcon className="size-4 text-red-600" />
      <span className="font-semibold text-red-700">{t("error")}</span>
    </div>
  )
}

function ThinkingMessage() {
  const { t } = useTranslation("status")
  return (
    <div className="flex items-center gap-2 mb-2 animate-pulse">
      <Spinner />
      <span>{t("thinking")}</span>
    </div>
  )
}
