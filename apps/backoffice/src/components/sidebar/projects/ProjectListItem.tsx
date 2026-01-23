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
import { Link, useParams } from "react-router-dom"
import { selectChatBots } from "@/features/chat-bots/chat-bots.selectors"
import { buildChatBotPath, buildProjectPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import type { MenuItem } from "../types"

type ProjectListItemProps = {
  project: ProjectDto
  organizationId: string
} & ItemOptionsProps

export function ProjectListItem({
  project,
  organizationId,
  onEdit,
  onDelete,
}: ProjectListItemProps) {
  const { projectId, chatBotId } = useParams<{ projectId: string; chatBotId: string }>()
  const chatBots = useAppSelector(selectChatBots(project.id))
  const item: MenuItem = {
    title: project.name,
    url: buildProjectPath({
      organizationId,
      projectId: project.id,
    }),
    isActive: projectId === project.id && !chatBotId,
    icon: FolderIcon,
    items: chatBots
      ? chatBots.chatBots.map((chatBot) => ({
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ItemOptions onEdit={onEdit} onDelete={onDelete} />
        </Link>
      </SidebarMenuButton>
      {item.items?.length ? (
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
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
