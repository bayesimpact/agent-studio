import { Button } from "@caseai-connect/ui/shad/button"
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
import { Outlet, useOutlet } from "react-router-dom"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { DeleteChatBotDialogWithTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithTrigger } from "@/components/chat-bots/EditChatBotDialog"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ChatBot as ChatBotType } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentChatBot } from "@/features/chat-bots/chat-bots.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function ChatBotRoute() {
  const { admin } = useAbility()
  const outlet = useOutlet()
  const chatBot = useAppSelector(selectCurrentChatBot)

  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = chatBot && admin ? `${chatBot.name} - Playground` : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (!chatBot) return
    if (admin) setHeaderRightSlot(<HeaderRightSlot chatBot={chatBot} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, chatBot, setHeaderRightSlot, admin])

  if (!chatBot) return <LoadingRoute />

  if (outlet) return <Outlet />
  return <div>TODO: list of sessions for chatbot {chatBot.name}</div>
}

function HeaderRightSlot({ chatBot }: { chatBot: ChatBotType }) {
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
