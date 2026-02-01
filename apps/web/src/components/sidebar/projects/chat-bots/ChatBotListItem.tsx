"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import { buildChatBotPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import type { MenuItem } from "../../types"

type ChatBotListItemProps = {
  chatBots: ChatBot[]
  organizationId: string
}

export function AdminChatBotListItem({
  chatBots,
  organizationId,
  onEditItem,
  onDeleteItem,
}: ChatBotListItemProps & {
  onEditItem: (item: { type: "chatBot"; value: ChatBot }) => void
  onDeleteItem: (item: { type: "chatBot"; value: ChatBot }) => void
}) {
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const items: MenuItem[] = chatBots.map((chatBot) => ({
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
  }))

  const findChatBotById = (id: string) => {
    return chatBots.find((chatBot) => chatBot.id === id)
  }

  const handleEditChatBot = (chatBotId: string) => {
    const chatBot = findChatBotById(chatBotId)
    if (!chatBot) return
    onEditItem({ type: "chatBot", value: chatBot })
  }

  const handleDeleteChatBot = (chatBotId: string) => {
    const chatBot = findChatBotById(chatBotId)
    if (!chatBot) return
    onDeleteItem({ type: "chatBot", value: chatBot })
  }
  return (
    <SidebarMenuSub>
      {items.map((subItem) => (
        <SidebarMenuSubItem key={subItem.id}>
          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
            <Link to={subItem.url}>
              {subItem.icon && <subItem.icon />}
              <span>{subItem.title}</span>

              <ChatBotOptions
                onEdit={() => handleEditChatBot(subItem.id)}
                onDelete={() => handleDeleteChatBot(subItem.id)}
              />
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}

export function AppChatBotListItem({ chatBots, organizationId }: ChatBotListItemProps) {
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const items: MenuItem[] = chatBots.map((chatBot) => ({
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
  }))
  return (
    <SidebarMenuSub>
      {items.map((subItem) => (
        <SidebarMenuSubItem key={subItem.id}>
          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
            <Link to={subItem.url}>
              {subItem.icon && <subItem.icon />}
              <span>{subItem.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
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
