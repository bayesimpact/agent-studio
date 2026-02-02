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
import { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useNavigate, useOutlet } from "react-router-dom"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { DeleteChatBotDialogWithTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithTrigger } from "@/components/chat-bots/EditChatBotDialog"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ChatBot as ChatBotType } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentChatBot } from "@/features/chat-bots/chat-bots.selectors"
import { selectFirstSession } from "@/features/chat-sessions/chat-sessions.selectors"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function ChatBotRoute() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { admin } = useAbility()
  const outlet = useOutlet()
  const chatBot = useAppSelector(selectCurrentChatBot)
  const firstChatSession = useAppSelector(selectFirstSession)
  const { buildPath } = useBuildPath()
  const sessionCreationInitiated = useRef(false)

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

  const onSuccess = useCallback(
    (chatSessionId: string) => {
      navigate(buildPath("chatSession", { chatSessionId }))
    },
    [navigate, buildPath],
  )

  // Create a new session if none exists (debounced via ref to prevent duplicate calls)
  useEffect(() => {
    if (!chatBot || outlet || firstChatSession || sessionCreationInitiated.current) return
    sessionCreationInitiated.current = true
    if (admin) dispatch(createPlaygroundSession({ onSuccess }))
    else dispatch(createAppSession({ onSuccess }))
  }, [chatBot, outlet, firstChatSession, admin, dispatch, onSuccess])

  if (!chatBot) return <LoadingRoute />

  if (outlet) return <Outlet />
  if (firstChatSession) {
    return (
      <Navigate to={buildPath("chatSession", { chatSessionId: firstChatSession.id })} replace />
    )
  }
  return null
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
