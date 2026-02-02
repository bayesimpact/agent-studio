"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, Edit, MoreHorizontal, PlusIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { CreateChatBotForm } from "@/components/chat-bots/CreateChatBotForm"
import { DeleteChatBotDialogWithOutTrigger } from "@/components/chat-bots/DeleteChatBotDialog"
import { EditChatBotDialogWithOutTrigger } from "@/components/chat-bots/EditChatBotDialog"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import { selectChatSessions } from "@/features/chat-sessions/chat-sessions.selectors"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { buildChatBotPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { AppNavItem } from "../../NavItem"
import { ChatSessionList } from "../chat-sessions/ChatSessionList"

type Item = { action: "edit" | "delete"; value: ChatBot }

export function AdminChatBotList({
  project,
  chatBots,
  organizationId,
}: {
  project: Project
  chatBots: ChatBot[]
  organizationId: string
}) {
  const navigate = useNavigate()
  const { getPath } = useBuildPath()
  const currentChatBotId = useAppSelector(selectCurrentChatBotId)
  const sessions = useAppSelector(selectChatSessions)
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
function CreateChatBotDialogWithTrigger({ project }: { project: Project }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Sheet modal open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <SidebarMenuButton>
            <PlusIcon />
            <span>{t("title")}</span>
          </SidebarMenuButton>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-dvh">
          <ScrollArea className="h-full">
            <SheetHeader>
              <SheetTitle>{t("title")}</SheetTitle>
              <SheetDescription>{t("description", { projectName: project.name })}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <CreateChatBotForm projectId={project.id} onSuccess={() => setOpen(false)} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
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
