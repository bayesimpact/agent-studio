import { Button } from "@caseai-connect/ui/shad/button"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
import { useState } from "react"
import { withRouter } from "storybook-addon-remix-react-router"
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
} from "@/components/chat/Chat"
import { DotsBackground } from "@/components/DotsBackground"

type Message = {
  id: string
  role: "bot" | "user"
  content: string
}

const meta = {
  title: "components/Chat",
  decorators: [withRouter],
  parameters: { layout: "fullscreen" },
  argTypes: {
    messages: { control: false },
  },
  args: {
    messages: [
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
    ],
  },
} satisfies Meta<unknown>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: { messages: Message[] }) => {
    const [messages, setMessages] = useState(args.messages)

    const handleSubmit = (value: string) => {
      setMessages((prev) => [
        ...prev,
        { id: String(prev.length + 1), role: "user", content: value },
      ])
    }
    return (
      <div className="h-screen w-screen">
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
  },
}
