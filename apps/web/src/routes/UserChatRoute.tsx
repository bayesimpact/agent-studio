import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Button } from "@caseai-connect/ui/shad/button"
import { CirclePlusIcon, MicIcon, PaperclipIcon } from "lucide-react"
import { useEffect } from "react"
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
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { RouteNames } from "./helpers"

export function UserChatRoute({ user }: { user: User }) {
  return (
    <SidebarLayout
      user={user}
      sidebarHeaderChildren={<Header to={RouteNames.HOME} />}
      sidebarContentChildren={<div>TODO</div>}
    >
      <UserChatBot />
    </SidebarLayout>
  )
}

function UserChatBot() {
  const { setHeaderTitle } = useSidebarLayout()
  useEffect(() => {
    setHeaderTitle("Chat with AI Assistant")
  }, [setHeaderTitle])

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
    <div className="flex flex-col gap-6 flex-1">
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

          <ChatFooter focus={false} onMessageSubmit={handleSubmit}>
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
