"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { SidebarMenuAction, SidebarMenuItem, useSidebar } from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DeleteChatBotDialogWithOutTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithOutTrigger } from "@/components/chat-bots/EditChatBotDialog"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import { selectChatSessions } from "@/features/chat-sessions/chat-sessions.selectors"
import { buildChatBotPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { AppNavItem } from "../../NavItem"
import { ChatSessionList } from "../chat-sessions/ChatSessionList"

type Item = { action: "edit" | "delete"; value: ChatBot }

export function AdminChatBotList({
  chatBots,
  organizationId,
}: {
  chatBots: ChatBot[]
  organizationId: string
}) {
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const sessions = useAppSelector(selectChatSessions)
  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)
  return (
    <>
      {chatBots.map((chatBot) => (
        <AppNavItem
          key={chatBot.id}
          item={{
            id: chatBot.id,
            title: chatBot.name,
            url: buildChatBotPath({
              organizationId,
              projectId: chatBot.projectId,
              chatBotId: chatBot.id,
              admin: true,
            }),
            isActive: currentChatBotId === chatBot.id,
            icon: BotIcon,
          }}
          itemOptions={
            <ChatBotOptions
              onEdit={() => handleItem({ action: "edit", value: chatBot })}
              onDelete={() => handleItem({ action: "delete", value: chatBot })}
            />
          }
        >
          {sessions && (
            <ChatSessionList
              sessions={sessions}
              chatBotId={chatBot.id}
              projectId={chatBot.projectId}
              organizationId={organizationId}
            />
          )}
        </AppNavItem>
      ))}

      <SidebarMenuItem>
        <CreateChatBotDialogWithTrigger />
      </SidebarMenuItem>

      <EditChatBotDialogWithOutTrigger
        chatBot={item?.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <DeleteChatBotDialogWithOutTrigger
        chatBot={item?.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </>
  )
}

export function AppChatBotList({
  chatBots,
  organizationId,
}: {
  chatBots: ChatBot[]
  organizationId: string
}) {
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const sessions = useAppSelector(selectChatSessions)
  return (
    <>
      {chatBots.map((chatBot) => (
        <AppNavItem
          key={chatBot.id}
          item={{
            id: chatBot.id,
            title: chatBot.name,
            url: buildChatBotPath({
              organizationId,
              projectId: chatBot.projectId,
              chatBotId: chatBot.id,
              admin: false,
            }),
            isActive: currentChatBotId === chatBot.id,
            icon: BotIcon,
          }}
        >
          {sessions && (
            <ChatSessionList
              sessions={sessions}
              chatBotId={chatBot.id}
              projectId={chatBot.projectId}
              organizationId={organizationId}
            />
          )}
        </AppNavItem>
      ))}
    </>
  )
}
function CreateChatBotDialogWithTrigger() {
  // TODO: Implement ChatBot creation dialog
  return <Button variant="outline">Create ChatBot</Button>
}

function ChatBotOptions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { isMobile } = useSidebar()
  const { t } = useTranslation("chatBot", { keyPrefix: "list.actions" })
  const { t: tCommon } = useTranslation("common")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal />
          <span className="sr-only">{tCommon("more")}</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="text-muted-foreground" />
          <span>{t("edit")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="text-muted-foreground" />
          <span>{t("delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
