"use client"

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
import { useNavigate, useParams } from "react-router-dom"
import { CreateChatBotDialogWithTrigger } from "@/components/chat-bots/CreateChatBotDialog"
import { DeleteChatBotDialogWithOutTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithOutTrigger } from "@/components/chat-bots/EditChatBotDialog"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { AppNavItem } from "../../NavItem"
import { ChatSessionList } from "../chat-sessions/ChatSessionList"

type Item = { action: "edit" | "delete"; value: ChatBot }

export function AdminChatBotList({ project, chatBots }: { project: Project; chatBots: ChatBot[] }) {
  const { chatBotId: urlChatBotId } = useParams()
  const navigate = useNavigate()

  const { getPath, buildPath } = useBuildPath()

  const [item, setItem] = useState<Item | null>(null)

  const handleItem = (item: Item) => setItem(item)

  const handleClose = () => {
    setItem(null)
    navigate(getPath("project"))
  }
  return (
    <>
      {chatBots.map((chatBot) => (
        <AppNavItem
          key={chatBot.id}
          item={{
            id: chatBot.id,
            title: chatBot.name,
            url: buildPath("chatBot", {
              projectId: chatBot.projectId,
              chatBotId: chatBot.id,
            }),
            isActive: urlChatBotId === chatBot.id,
            icon: BotIcon,
          }}
          itemOptions={
            <ChatBotOptions
              onEdit={() => handleItem({ action: "edit", value: chatBot })}
              onDelete={() => handleItem({ action: "delete", value: chatBot })}
            />
          }
        >
          <ChatSessionList chatBotId={chatBot.id} projectId={chatBot.projectId} />
        </AppNavItem>
      ))}

      <SidebarMenuItem>
        <CreateChatBotDialogWithTrigger project={project} />
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

export function AppChatBotList({ chatBots }: { chatBots: ChatBot[] }) {
  const { chatBotId: urlChatBotId } = useParams()
  const { buildPath } = useBuildPath()
  return (
    <>
      {chatBots.map((chatBot) => (
        <AppNavItem
          key={chatBot.id}
          item={{
            id: chatBot.id,
            title: chatBot.name,
            url: buildPath("chatBot", {
              projectId: chatBot.projectId,
              chatBotId: chatBot.id,
            }),
            isActive: urlChatBotId === chatBot.id,
            icon: BotIcon,
          }}
        >
          <ChatSessionList chatBotId={chatBot.id} projectId={chatBot.projectId} />
        </AppNavItem>
      ))}
    </>
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
