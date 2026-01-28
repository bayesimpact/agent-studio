import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { AlertCircleIcon, CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ChatBot as ChatBotModel } from "@/features/chat-bots/chat-bots.models"
import { sendMessage } from "@/features/chat-session/chat-session.thunks"
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
import { DotsBackground } from "../DotsBackground"

export function ChatBot({ chatBot }: { chatBot: ChatBotModel }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "detail" })
  const { t: tChat } = useTranslation("chat")
  const messages = [
    {
      id: "1",
      role: "bot",
      content: t("mock.msg1"),
    },
    {
      id: "2",
      role: "user",
      content: t("mock.msg2"),
    },
  ]
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.chatSession.session)
  const isStreaming = useAppSelector((state) => state.chatSession.isStreaming)

  const handleSubmit = (message: string) => {
    if (!session || isStreaming || !message.trim()) {
      return
    }

    void dispatch(sendMessage({ sessionId: session.id, content: message.trim() }))
  }
  return (
    <div className="p-6 flex flex-col gap-6 flex-1">
      <Item variant="outline">
        <ItemHeader>
          <ItemTitle>{t("defaultPromptTitle")}</ItemTitle>
        </ItemHeader>
        <ItemContent>{chatBot.defaultPrompt}</ItemContent>
      </Item>

      <DotsBackground className="p-10">
        <Chat>
          <ChatHeader />
          <ChatContent>
            {messages.map((message) =>
              message.role === "assistant" ? (
                <ChatBotMessage
                  key={message.id}
                  className={
                    message.status === "error"
                      ? "bg-red-50 border border-red-200 text-red-800"
                      : undefined
                  }
                >
                  {message.status === "error" && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircleIcon className="size-4 text-red-600" />
                      <span className="font-semibold text-red-700">Error</span>
                    </div>
                  )}
                  {message.content}
                </ChatBotMessage>
              ) : (
                <ChatUserMessage key={message.id}>{message.content}</ChatUserMessage>
              ),
            )}
          </ChatContent>

          <ChatFooter onMessageSubmit={handleSubmit}>
            <ChatInput
              placeholder={tChat("placeholder")}
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
