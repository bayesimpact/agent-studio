import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ChatBot as ChatBotModel } from "@/features/chat-bots/chat-bots.models"
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

  const handleSubmit = (_message: string) => {
    // TODO:
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
                <ChatBotMessage key={message.id}>{message.content}</ChatBotMessage>
              ) : (
                <ChatUserMessage key={message.id}>{message.content}</ChatUserMessage>
              ),
            )}
          </ChatContent>

          <ChatFooter onMessageSubmit={handleSubmit}>
            <ChatInput placeholder={tChat("placeholder")} className="resize-none" />

            <ChatActions>
              <div className="flex-1 justify-start flex gap-1">
                <Button variant="secondary">
                  <CirclePlusIcon />
                </Button>
                <Button variant="ghost">
                  <PaperclipIcon />
                </Button>
                <Button variant="ghost">
                  <MicIcon />
                </Button>
              </div>
              <ChatSubmit variant="ghost" />
            </ChatActions>
          </ChatFooter>
        </Chat>
      </DotsBackground>
    </div>
  )
}
