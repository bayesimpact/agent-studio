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

export function ProjectListItem({
  project,
  organizationId,
  onEditItem,
  onDeleteItem,
}: ProjectListItemProps) {
  const projectId = useAppSelector(selectCurrentProjectId)
  const chatBotId = useAppSelector(selectCurrentChatBotId)
  const chatBots = useAppSelector(selectChatBots) || []
  const item: MenuItem = {
    id: project.id,
    title: project.name,
    url: buildProjectPath({
      organizationId,
      projectId: project.id,
    }),
    isActive: projectId === project.id && !chatBotId,
    icon: FolderIcon,
    items: chatBots
      ? chatBots.map((chatBot) => ({
          id: chatBot.id,
          title: chatBot.name,
          url: buildChatBotPath({
            organizationId,
            projectId: project.id,
            chatBotId: chatBot.id,
          }),
          isActive: chatBotId === chatBot.id,
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

type ItemOptionsProps = { onEdit: () => void; onDelete: () => void }

function ItemOptions({ onEdit, onDelete }: ItemOptionsProps) {
  const { isMobile } = useSidebar()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="text-muted-foreground" />
          <span>Edit Project</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="text-muted-foreground" />
          <span>Delete Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChatBotItemOptions({ onEdit, onDelete }: ItemOptionsProps) {
  const { isMobile } = useSidebar()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="text-muted-foreground" />
          <span>Edit Chat Bot</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="text-muted-foreground" />
          <span>Delete Chat Bot</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
