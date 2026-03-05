import { Button } from "@caseai-connect/ui/shad/button"
import { FileCheckIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { DotsBackground } from "@/components/DotsBackground"
import { AttachDocument } from "@/components/document/AttachDocument"
import { TraceUrlOpener } from "@/components/TraceUrlOpener"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import type { AgentSessionMessage as AgentSessionMessageType } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/components/AgentSessionMessage"
import {
  Chat,
  ChatActions,
  ChatContent,
  ChatFooter,
  ChatHeader,
  ChatInput,
  ChatSubmit,
} from "@/features/agents/shared/agent-session-messages/components/Chat"
import { Dictaphone } from "@/features/agents/shared/agent-session-messages/components/Dictaphone"
import { useScrollToEnd } from "@/hooks/use-scroll-to-end"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectStreaming } from "../agent-session-messages.selectors"
import { sendMessage } from "../agent-session-messages.thunks"

export function AgentSessionMessages({
  isAdminInterface,
  session,
  messages,
  rightSlot,
}: {
  rightSlot?: React.ReactNode
  isAdminInterface: boolean
  session: ConversationAgentSession
  messages: AgentSessionMessageType[]
}) {
  const isStreaming = useAppSelector(selectStreaming)

  if (isAdminInterface)
    return (
      <div className="flex flex-1 max-h-screen gap-4">
        <div className="flex flex-1">
          <DotsBackground className="p-10 w-full">
            <Chat>
              <ChatHeader>
                <TraceUrlOpener traceUrl={session.traceUrl} />
              </ChatHeader>

              <Messages messages={messages} isStreaming={isStreaming} />

              <Footer session={session} isStreaming={isStreaming} />
            </Chat>
          </DotsBackground>
        </div>
        {rightSlot && <div className="w-80 shrink-0 h-full border-l">{rightSlot}</div>}
      </div>
    )

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col gap-6 flex-1 max-w-2/3">
          <Chat className="shadow-none">
            <Messages messages={messages} isStreaming={isStreaming} />

            <Footer session={session} isStreaming={isStreaming} />
          </Chat>
        </div>
      </div>
      {rightSlot && <div className="w-80 shrink-0 h-full border-l">{rightSlot}</div>}
    </div>
  )
}

function Messages({
  messages,
  isStreaming,
}: {
  messages: AgentSessionMessageType[]
  isStreaming: boolean
}) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollToEnd = useScrollToEnd(chatEndRef)

  useEffect(() => {
    if (isStreaming) return
    scrollToEnd()
  }, [isStreaming, scrollToEnd])

  return (
    <ChatContent>
      {messages?.map((message) => (
        <AgentSessionMessage key={message.id} message={message} />
      ))}
      <div ref={chatEndRef} />
    </ChatContent>
  )
}

function Footer({
  session,
  isStreaming,
}: {
  session: ConversationAgentSession
  isStreaming: boolean
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [file, setFile] = useState<File>()

  const handleAttachDocument = (attachedFile: File) => setFile(attachedFile)
  const handleUnattachDocument = () => setFile(undefined)

  const handleSubmit = (message: string) => {
    const trimmedMessage = message.trim()
    if (isStreaming || !trimmedMessage) return
    void dispatch(sendMessage({ content: trimmedMessage, file }))
    handleUnattachDocument()
  }

  return (
    <ChatFooter focus={!isStreaming} onMessageSubmit={handleSubmit}>
      <ChatInput
        placeholder={t("conversationAgentSession:chat.placeholder")}
        className="resize-none"
        disabled={isStreaming || !session}
      />

      <ChatActions>
        <div className="flex-1 justify-start flex gap-1">
          {/* <Button variant="secondary" disabled={isStreaming || !session}>
            <CirclePlusIcon />
          </Button> */}

          <div className="flex items-center gap-1">
            <AttachDocument onAttach={handleAttachDocument} disabled={isStreaming || !session} />
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
  )
}
