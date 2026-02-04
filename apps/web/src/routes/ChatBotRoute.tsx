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
import { Outlet, useNavigate, useOutlet, useParams } from "react-router-dom"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { DeleteChatBotDialogWithTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithTrigger } from "@/components/chat-bots/EditChatBotDialog"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { CreateChatSession } from "@/components/sidebar/projects/chat-sessions/CreateChatSession"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotData, selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { selectChatSessionsFromChatBotId } from "@/features/chat-sessions/chat-sessions.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ChatBotRoute() {
  const chatBotId = useAppSelector(selectCurrentChatBotId)
  const chatBot = useAppSelector(selectChatBotData)
  const chatSessions = useAppSelector(selectChatSessionsFromChatBotId(chatBotId))

  useHandleFirstChatSession({ chatBotId, chatSessions })

  if (ADS.isError(chatBot) || ADS.isError(chatSessions)) return <NotFoundRoute />

  if (ADS.isFulfilled(chatBot) && ADS.isFulfilled(chatSessions)) {
    return <WithData key={chatBotId} chatBot={chatBot.value} />
  }

  return <LoadingRoute />
}

function useHandleFirstChatSession({
  chatBotId,
  chatSessions,
}: {
  chatBotId: string | null
  chatSessions: AsyncData<ChatSession[]>
}) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()

  useEffect(() => {
    if (!ADS.isFulfilled(chatSessions)) return
    if (chatSessions.value.length === 0) return
    if (!organizationId || !projectId || !chatBotId) return

    const firstChatSessionId = chatSessions.value[0]?.id
    if (!firstChatSessionId) return
    const path = buildPath("chatSession", {
      organizationId,
      projectId,
      chatBotId,
      chatSessionId: firstChatSessionId,
    })
    navigate(path, { replace: true })
  }, [chatSessions, organizationId, projectId, chatBotId, buildPath, navigate])
}

function WithData({ chatBot }: { chatBot: ChatBot }) {
  const outlet = useOutlet()

  useHandleHeader(chatBot)

  if (outlet) return <Outlet />

  return <NoChatSession chatBotId={chatBot.id} />
}

function NoChatSession({ chatBotId }: { chatBotId: string }) {
  const { t } = useTranslation("chatSession", { keyPrefix: "list" })
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  if (!organizationId || !projectId) return null
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
          <CardDescription>{t("empty.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateChatSession
            type="button"
            organizationId={organizationId}
            projectId={projectId}
            chatBotId={chatBotId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function useHandleHeader(chatBot: ChatBot) {
  const { isAdminInterface } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = chatBot && isAdminInterface ? `${chatBot.name} - Playground` : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot chatBot={chatBot} />)
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, chatBot, setHeaderRightSlot, isAdminInterface])
}

function HeaderRightSlot({ chatBot }: { chatBot: ChatBot }) {
  const { organizationId } = useParams()
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <DefaultPromptDialog prompt={chatBot.defaultPrompt} />
      <EditChatBotDialogWithTrigger chatBot={chatBot} />
      <DeleteChatBotDialogWithTrigger organizationId={organizationId} chatBot={chatBot} />
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
