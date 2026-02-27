import { Button } from "@caseai-connect/ui/shad/button"
import { FileCheckIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  AgentSessionMessage as AgentSessionMessageType,
  AgentSession as AgentSessionType,
} from "@/features/agent-sessions/agent-sessions.models"
import { selectStreaming } from "@/features/agent-sessions/agent-sessions.selectors"
import { sendMessage } from "@/features/agent-sessions/agent-sessions.thunks"
import { useScrollToEnd } from "@/hooks/use-scroll-to-end"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { Dictaphone } from "../agent/actions/Dictaphone"
import {
  Chat,
  ChatActions,
  ChatContent,
  ChatFooter,
  ChatHeader,
  ChatInput,
  ChatSubmit,
} from "../chat/Chat"
import { DotsBackground } from "../DotsBackground"
import { AttachDocument } from "../document/AttachDocument"
import { TraceUrlOpener } from "../TraceUrlOpener"
import { AgentSessionMessage } from "./AgentSessionMessage"

export function AgentSession({
  isAdminInterface,
  session,
  messages,
}: {
  isAdminInterface: boolean
  session: AgentSessionType
  messages: AgentSessionMessageType[]
}) {
  const isStreaming = useAppSelector(selectStreaming)

  if (isAdminInterface)
    return (
      <div className="p-6 flex flex-col gap-6 flex-1 max-h-screen">
        <DotsBackground className="p-10">
          <Chat>
            <ChatHeader>
              <TraceUrlOpener traceUrl={session.traceUrl} />
            </ChatHeader>

            <Messages messages={messages} isStreaming={isStreaming} />

            <Footer session={session} isStreaming={isStreaming} />
          </Chat>
        </DotsBackground>
      </div>
    )

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="flex flex-col gap-6 flex-1 max-w-2/3">
        <Chat className="shadow-none">
          <Messages messages={messages} isStreaming={isStreaming} />

          <Footer session={session} isStreaming={isStreaming} />
        </Chat>
      </div>
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

function Footer({ session, isStreaming }: { session: AgentSessionType; isStreaming: boolean }) {
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
        placeholder={t("agentSession:chat.placeholder")}
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
