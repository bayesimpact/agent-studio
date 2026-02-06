import { Button } from "@caseai-connect/ui/shad/button"
import { Spinner } from "@caseai-connect/ui/shad/spinner"
import { AlertCircleIcon, CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type {
  AgentSession,
  AgentSessionMessage,
} from "@/features/agent-sessions/agent-sessions.models"
import { selectStreaming } from "@/features/agent-sessions/agent-sessions.selectors"
import { sendMessage } from "@/features/agent-sessions/agent-sessions.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  Chat,
  ChatActions,
  ChatBotMessage,
  ChatContent,
  ChatFooter,
  ChatHeader,
  ChatInput,
  ChatSubmit,
  ChatUserMessage,
} from "../chat/Chat"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"
import { DotsBackground } from "../DotsBackground"

export function AdminAgentSession({
  session,
  messages,
}: {
  session: AgentSession
  messages: AgentSessionMessage[]
}) {
  const { t } = useTranslation("chat")
  const dispatch = useAppDispatch()
  const isStreaming = useAppSelector(selectStreaming)

  const handleSubmit = (message: string) => {
    if (!session || isStreaming || !message.trim()) {
      return
    }

    void dispatch(sendMessage({ sessionId: session.id, content: message.trim() }))
  }
  return (
    <div className="p-6 flex flex-col gap-6 flex-1">
      <DotsBackground className="p-10">
        <Chat>
          <ChatHeader />
          <ChatContent>
            {messages?.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ChatContent>

          <ChatFooter focus={!isStreaming} onMessageSubmit={handleSubmit}>
            <ChatInput
              placeholder={t("placeholder")}
              className="resize-none"
              disabled={isStreaming || !session}
            />

            <ChatActions>
              <div className="flex-1 justify-start flex gap-1">
                <Button variant="secondary" disabled={isStreaming || !session}>
                  <CirclePlusIcon />
                </Button>
                <Button variant="ghost" disabled={isStreaming || !session}>
                  <PaperclipIcon />
                </Button>
                <Button variant="ghost" disabled={isStreaming || !session}>
                  <MicIcon />
                </Button>
              </div>
              <ChatSubmit variant="ghost" disabled={isStreaming || !session} />
            </ChatActions>
          </ChatFooter>
        </Chat>
      </DotsBackground>
    </div>
  )
}

export function AppAgentSession({
  session,
  messages,
}: {
  session: AgentSession
  messages: AgentSessionMessage[]
}) {
  const { t } = useTranslation("chat")
  const dispatch = useAppDispatch()
  const isStreaming = useAppSelector(selectStreaming)

  const handleSubmit = (message: string) => {
    if (!session || isStreaming || !message.trim()) {
      return
    }

    void dispatch(sendMessage({ sessionId: session.id, content: message.trim() }))
  }
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="flex flex-col gap-6 flex-1 max-w-2/3">
        <Chat className="shadow-none">
          <ChatContent>
            {messages?.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ChatContent>

          <ChatFooter focus={!isStreaming} onMessageSubmit={handleSubmit}>
            <ChatInput
              placeholder={t("placeholder")}
              className="resize-none"
              disabled={isStreaming || !session}
            />

            <ChatActions>
              <div className="flex-1 justify-start flex gap-1">
                <Button variant="secondary" disabled={isStreaming || !session}>
                  <CirclePlusIcon />
                </Button>
                <Button variant="ghost" disabled={isStreaming || !session}>
                  <PaperclipIcon />
                </Button>
                <Button variant="ghost" disabled={isStreaming || !session}>
                  <MicIcon />
                </Button>
              </div>
              <ChatSubmit variant="ghost" disabled={isStreaming || !session} />
            </ChatActions>
          </ChatFooter>
        </Chat>
      </div>
    </div>
  )
}

function Message({ message }: { message: AgentSessionMessage }) {
  const isAssistant = message.role === "assistant"
  const isStreaming = message.status === "streaming"
  const isError = message.status === "error"
  if (isAssistant) {
    return (
      <ChatBotMessage
        key={message.id}
        className={isError ? "bg-red-50 border border-red-200 text-red-800" : undefined}
      >
        {isStreaming && <ThinkingMessage />}
        {isError && <ErrorMessage />}

        <MarkdownWrapper content={message.content} />
      </ChatBotMessage>
    )
  } else return <ChatUserMessage key={message.id}>{message.content}</ChatUserMessage>
}

function ErrorMessage() {
  return (
    <div className="flex items-center gap-2 mb-2">
      <AlertCircleIcon className="size-4 text-red-600" />
      <span className="font-semibold text-red-700">Error</span>
    </div>
  )
}

function ThinkingMessage() {
  const { t } = useTranslation("agent", { keyPrefix: "detail" })
  return (
    <div className="flex items-center gap-2 mb-2 animate-pulse">
      <Spinner />
      <span>{t("thinking")}</span>
    </div>
  )
}
