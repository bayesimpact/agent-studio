import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useOutlet } from "react-router-dom"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { DeleteChatBotDialogWithTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithTrigger } from "@/components/chat-bots/EditChatBotDialog"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { CreateChatSession } from "@/components/sidebar/projects/chat-sessions/CreateChatSession"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"

export function ChatBotRoute({
  chatBot,
  chatSessions,
}: {
  chatBot: ChatBot
  chatSessions: ChatSession[]
}) {
  const outlet = useOutlet()

  useHandleHeader(chatBot)

  if (outlet) return <Outlet />

  if (chatSessions.length > 0) {
    return <FirstChatSession chatSession={chatSessions[0]} />
  }
  return <NoChatSession chatBotId={chatBot.id} />
}

function FirstChatSession({ chatSession }: { chatSession?: ChatSession }) {
  const { buildPath } = useBuildPath()
  if (!chatSession) return null
  return <Navigate to={buildPath("chatSession", { chatSessionId: chatSession.id })} replace />
}

function NoChatSession({ chatBotId }: { chatBotId: string }) {
  const { t } = useTranslation("chatSession", { keyPrefix: "list" })
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
          <CardDescription>{t("empty.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateChatSession chatBotId={chatBotId} type="button" />
        </CardContent>
      </Card>
    </div>
  )
}

function useHandleHeader(chatBot: ChatBot) {
  const { admin } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = chatBot && admin ? `${chatBot.name} - Playground` : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (admin) setHeaderRightSlot(<HeaderRightSlot chatBot={chatBot} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, chatBot, setHeaderRightSlot, admin])
}

function HeaderRightSlot({ chatBot }: { chatBot: ChatBot }) {
  return (
    <div className="flex items-center gap-2">
      <DefaultPromptDialog prompt={chatBot.defaultPrompt} />
      <EditChatBotDialogWithTrigger chatBot={chatBot} />
      <DeleteChatBotDialogWithTrigger chatBot={chatBot} />
    </div>
  )
}

function DefaultPromptDialog({ prompt }: { prompt: string }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "detail" })
  return (
    <Sheet modal>
      <SheetTrigger asChild>
        <Button variant="outline">{t("viewPrompt")}</Button>
      </SheetTrigger>
      <SheetContent className="h-dvh min-w-[40vw]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("defaultPromptTitle")}</SheetTitle>
          </SheetHeader>
          <Item>
            <ItemContent>
              <MarkdownWrapper content={prompt} />
            </ItemContent>
          </Item>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
