import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
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
  const messages = [
    {
      id: "1",
      role: "bot",
      content: "Hey, ask me anything!",
    },
    {
      id: "2",
      role: "user",
      content: "What can you do?",
    },
  ]

  const handleSubmit = (_message: string) => {
    // TODO:
  }
  return (
    <div className="p-6 flex flex-col gap-6 flex-1">
      <Item variant="outline">
        <ItemHeader>
          <ItemTitle>Default Prompt</ItemTitle>
        </ItemHeader>
        <ItemContent>{chatBot.defaultPrompt}</ItemContent>
      </Item>

      <DotsBackground className="p-10">
        <Chat>
          <ChatHeader />
          <ChatContent>
            {messages.map((msg) =>
              msg.role === "bot" ? (
                <ChatBotMessage key={msg.id}>{msg.content}</ChatBotMessage>
              ) : (
                <ChatUserMessage key={msg.id}>{msg.content}</ChatUserMessage>
              ),
            )}
          </ChatContent>

          <ChatFooter onMessageSubmit={handleSubmit}>
            <ChatInput placeholder="Ask a question..." className="resize-none" />

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
