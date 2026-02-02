import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { format } from "date-fns"
import { MessagesSquareIcon } from "lucide-react"
import { Link } from "react-router-dom"
import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { selectCurrentChatSessionId } from "@/features/chat-sessions/chat-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { buildChatSessionPath } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { getLocale } from "@/utils/get-locale"
import type { MenuItem } from "../../types"
import { CreateChatSession } from "./CreateChatSession"

export function ChatSessionList({
  sessions,
  chatBotId,
  projectId,
  organizationId,
}: {
  projectId: string
  chatBotId: string
  sessions: ChatSession[]
  organizationId: string
}) {
  const { admin } = useAbility()
  const currentChatSessionId = useAppSelector(selectCurrentChatSessionId)
  const items: MenuItem[] = sessions.map((session) => ({
    id: session.id,
    title: format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", {
      locale: getLocale(),
    }),
    url: buildChatSessionPath({
      organizationId,
      projectId,
      chatBotId,
      chatSessionId: session.id,
      admin,
    }),
    isActive: currentChatSessionId === session.id,
    icon: MessagesSquareIcon,
  }))
  return (
    <SidebarMenuSub>
      <CreateChatSession />

      {items.map((item) => (
        <SidebarMenuSubItem key={item.id}>
          <SidebarMenuSubButton asChild isActive={item.isActive}>
            <Link to={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {/* // TODO: dropdown with delete option */}
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}
