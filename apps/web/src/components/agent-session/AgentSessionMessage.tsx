import { Spinner } from "@caseai-connect/ui/shad/spinner"
import { cn } from "@caseai-connect/ui/utils"
import { AlertCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { AgentSessionMessage as AgentSessionMessageType } from "@/features/agent-sessions/agent-sessions.models"
import { FeedbackCreator } from "../agent-message-feedback/FeedbackCreator"
import { ChatBotMessage, ChatUserMessage } from "../chat/Chat"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"
import { Attachment } from "./Attachment"

export function AgentSessionMessage({ message }: { message: AgentSessionMessageType }) {
  const isAssistant = message.role === "assistant"
  const isStreaming = message.status === "streaming"
  const isError = message.status === "error"
  if (isAssistant) {
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
  } else
    return (
      <div className="flex flex-col gap-2 items-end">
        <ChatUserMessage key={message.id}>{message.content}</ChatUserMessage>
        <Attachment message={message} />
      </div>
    )
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
