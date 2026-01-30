"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, Edit, FolderIcon, MoreHorizontal, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBots, selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { buildChatBotPath, buildProjectPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import type { MenuItem } from "../types"

type ProjectListItemProps = {
  project: ProjectDto
  organizationId: string
} & {
  onEditItem: (
    item: { type: "project"; value: ProjectDto } | { type: "chatBot"; value: ChatBot },
  ) => void
  onDeleteItem: (
    item: { type: "project"; value: ProjectDto } | { type: "chatBot"; value: ChatBot },
  ) => void
}

export function AdminProjectListItem({
  project,
  organizationId,
  onEditItem,
  onDeleteItem,
}: ProjectListItemProps) {
  const currentProjectId = useAppSelector(selectCurrentProjectId)
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const chatBots = useAppSelector(selectChatBots(project.id)) || []
  const item: MenuItem = {
    id: project.id,
    title: project.name,
    url: buildProjectPath({
      organizationId,
      projectId: project.id,
      admin: true,
    }),
    isActive: currentProjectId === project.id && !currentChatBotId,
    icon: FolderIcon,
    items: chatBots
      ? chatBots.map((chatBot) => ({
          id: chatBot.id,
          title: chatBot.name,
          url: buildChatBotPath({
            organizationId,
            projectId: project.id,
            chatBotId: chatBot.id,
            admin: true,
          }),
          isActive: currentChatBotId === chatBot.id,
          icon: BotIcon,
        }))
      : [],
  }

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
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ItemOptions
            onEdit={() => onEditItem({ type: "project", value: project })}
            onDelete={() => onDeleteItem({ type: "project", value: project })}
          />
        </Link>
      </SidebarMenuButton>
      {item.items?.length ? (
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.id}>
              <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                <Link to={subItem.url}>
                  {subItem.icon && <subItem.icon />}
                  <span>{subItem.title}</span>
                  <ChatBotItemOptions
                    onEdit={() => handleEditChatBot(subItem.id)}
                    onDelete={() => handleDeleteChatBot(subItem.id)}
                  />
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}

export function AppProjectListItem({ project, organizationId }: ProjectListItemProps) {
  const currentProjectId = useAppSelector(selectCurrentProjectId)
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const chatBots = useAppSelector(selectChatBots(project.id)) || []
  const item: MenuItem = {
    id: project.id,
    title: project.name,
    url: buildProjectPath({
      organizationId,
      projectId: project.id,
      admin: false,
    }),
    isActive: currentProjectId === project.id && !currentChatBotId,
    icon: FolderIcon,
    items: chatBots
      ? chatBots.map((chatBot) => ({
          id: chatBot.id,
          title: chatBot.name,
          url: buildChatBotPath({
            organizationId,
            projectId: project.id,
            chatBotId: chatBot.id,
            admin: false,
          }),
          isActive: currentChatBotId === chatBot.id,
          icon: BotIcon,
        }))
      : [],
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.items?.length ? (
        <SidebarMenuSub>
          {item.items.map((subItem) => (
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
      ) : null}
    </SidebarMenuItem>
  )
}

type ItemOptionsProps = { onEdit: () => void; onDelete: () => void }

function ItemOptions({ onEdit, onDelete }: ItemOptionsProps) {
  const { isMobile } = useSidebar()
  const { t } = useTranslation("project", { keyPrefix: "list.actions" })
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

function ChatBotItemOptions({ onEdit, onDelete }: ItemOptionsProps) {
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
