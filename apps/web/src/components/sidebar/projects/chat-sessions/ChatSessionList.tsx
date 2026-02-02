import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { format } from "date-fns"
import { MessagesSquareIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { getLocale } from "@/utils/get-locale"
import type { MenuItem } from "../../types"
import { CreateChatSession } from "./CreateChatSession"

export function ChatSessionList({
  sessions,
  chatBotId,
  projectId,
}: {
  projectId: string
  chatBotId: string
  sessions: ChatSession[]
}) {
  const { buildPath } = useBuildPath()
  const { chatSessionId: currentChatSessionId } = useParams()
  const items: MenuItem[] = sessions.map((session) => ({
    id: session.id,
    title: format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", {
      locale: getLocale(),
    }),
    url: buildPath("chatSession", {
      projectId,
      chatBotId,
      chatSessionId: session.id,
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
