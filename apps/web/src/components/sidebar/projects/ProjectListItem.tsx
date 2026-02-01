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
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { Edit, FolderIcon, MoreHorizontal, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBots, selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { buildProjectPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import type { MenuItem } from "../types"
import { AdminChatBotListItem, AppChatBotListItem } from "./chat-bots/ChatBotListItem"

type ProjectListItemProps = {
  project: ProjectDto
  organizationId: string
}

export function AdminProjectListItem({
  project,
  organizationId,
  onEditItem,
  onDeleteItem,
}: ProjectListItemProps & {
  onEditItem: (
    item: { type: "project"; value: ProjectDto } | { type: "chatBot"; value: ChatBot },
  ) => void
  onDeleteItem: (
    item: { type: "project"; value: ProjectDto } | { type: "chatBot"; value: ChatBot },
  ) => void
}) {
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
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ProjectOptions
            onEdit={() => onEditItem({ type: "project", value: project })}
            onDelete={() => onDeleteItem({ type: "project", value: project })}
          />
        </Link>
      </SidebarMenuButton>

      {chatBots.length > 0 && (
        <AdminChatBotListItem
          chatBots={chatBots}
          organizationId={organizationId}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      )}
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
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={item.isActive} asChild>
        <Link to={item.url} className="font-medium">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>

      {chatBots.length > 0 && (
        <AppChatBotListItem chatBots={chatBots} organizationId={organizationId} />
      )}
    </SidebarMenuItem>
  )
}

function ProjectOptions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
