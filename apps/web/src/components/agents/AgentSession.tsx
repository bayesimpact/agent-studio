import { Button } from "@caseai-connect/ui/shad/button"
import { Spinner } from "@caseai-connect/ui/shad/spinner"
import { cn } from "@caseai-connect/ui/utils"
import {
  AlertCircleIcon,
  CirclePlusIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  AgentSessionMessage,
  AgentSession as AgentSessionType,
} from "@/features/agent-sessions/agent-sessions.models"
import { selectStreaming } from "@/features/agent-sessions/agent-sessions.selectors"
import { sendMessage } from "@/features/agent-sessions/agent-sessions.thunks"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useScrollToEnd } from "@/hooks/use-scroll-to-end"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { CreateFeedbackDialog } from "../agent-message-feedback/CreateFeedbackDialog"
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
import { AttachDocument } from "../documents/AttachDocument"
import { Dictaphone } from "./actions/Dictaphone"

export function AgentSession({
  isAdminInterface,
  session,
  messages,
}: {
  isAdminInterface: boolean
  session: AgentSessionType
  messages: AgentSessionMessage[]
}) {
  const { t } = useTranslation("chat")
  const dispatch = useAppDispatch()
  const isStreaming = useAppSelector(selectStreaming)
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const [file, setFile] = useState<File>()

  const chatSubmitRef = useRef<HTMLButtonElement>(null)
  const scrollToEnd = useScrollToEnd(chatSubmitRef)

  useEffect(() => {
    if (isStreaming) return
    scrollToEnd()
  }, [isStreaming, scrollToEnd])

  if (!organizationId || !projectId) return null

  const handleAttachDocument = (file: File) => {
    setFile(file)
  }

  const handleUnattachDocument = () => {
    setFile(undefined)
  }

  const handleSubmit = (message: string) => {
    const trimedMessage = message.trim()
    if (isStreaming || !trimedMessage) return
    void dispatch(sendMessage({ content: trimedMessage, file }))
    handleUnattachDocument()
  }

  if (isAdminInterface)
    return (
      <div className="p-6 flex flex-col gap-6 flex-1">
        <DotsBackground className="p-10">
          <Chat>
            <ChatHeader>
              {session.traceUrl && (
                <Button asChild variant="ghost">
                  <a href={session.traceUrl} className="cursor-pointer" target="_blank">
                    Trace Url
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              )}
            </ChatHeader>
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

                  <div className="flex items-center gap-1">
                    <AttachDocument
                      onAttach={handleAttachDocument}
                      disabled={isStreaming || !session}
                    />
                    {file && (
                      <Button variant="default" onClick={handleUnattachDocument}>
                        <FileCheckIcon className="size-4" /> {file?.name}
                        <XIcon className="size-4" />
                      </Button>
                    )}
                  </div>

                  <Dictaphone disabled={isStreaming || !session} />
                </div>
                <ChatSubmit variant="ghost" disabled={isStreaming || !session} />
              </ChatActions>
            </ChatFooter>
          </Chat>
        </DotsBackground>
      </div>
    )
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
              <div className="flex-1 justify-start items-center flex gap-1">
                <Button variant="secondary" disabled={isStreaming || !session}>
                  <CirclePlusIcon />
                </Button>

                <div className="flex items-center gap-1">
                  <AttachDocument
                    onAttach={handleAttachDocument}
                    disabled={isStreaming || !session}
                  />
                  {file && (
                    <Button variant="default" onClick={handleUnattachDocument}>
                      <FileCheckIcon className="size-4" /> {file?.name}
                      <XIcon className="size-4" />
                    </Button>
                  )}
                </div>

                <Dictaphone disabled={isStreaming || !session} />
              </div>
              <ChatSubmit ref={chatSubmitRef} variant="ghost" disabled={isStreaming || !session} />
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
      <div key={message.id} className="max-w-3/4 relative">
        <ChatBotMessage
          className={cn("pb-8", isError && "bg-red-50 border border-red-200 text-red-800")}
        >
          {isStreaming && <ThinkingMessage />}
          {isError && <ErrorMessage />}

          <MarkdownWrapper content={message.content} />
        </ChatBotMessage>

        <CreateFeedbackDialog message={message} />
      </div>
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
