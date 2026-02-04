import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { format } from "date-fns"
import { MessagesSquareIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { selectChatSessionsFromChatBotId } from "@/features/chat-sessions/chat-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { getLocale } from "@/utils/get-locale"
import type { MenuItem } from "../../types"
import { CreateChatSession } from "./CreateChatSession"

export function ChatSessionList({
  organizationId,
  chatBotId,
  projectId,
}: {
  organizationId: string
  projectId: string
  chatBotId: string
}) {
  const { chatSessionId: urlChatSessionId } = useParams()
  const { buildPath } = useBuildPath()

  const sessions = useAppSelector(selectChatSessionsFromChatBotId(chatBotId))

  const items: MenuItem[] = ADS.isFulfilled(sessions)
    ? sessions.value.map((session) => ({
        id: session.id,
        title: format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", {
          locale: getLocale(),
        }),
        url: buildPath("chatSession", {
          organizationId,
          projectId,
          chatBotId,
          chatSessionId: session.id,
        }),
        isActive: urlChatSessionId === session.id,
        icon: MessagesSquareIcon,
      }))
    : []
  return (
    <SidebarMenuSub>
      {items.length > 0 && (
        <CreateChatSession
          organizationId={organizationId}
          projectId={projectId}
          chatBotId={chatBotId}
          type="menu"
        />
      )}

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
