import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@caseai-connect/ui/shad/sidebar"
import { MessageSquarePlusIcon, MessagesSquareIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import type { ChatSession } from "@/features/chat-sessions/chat-sessions.models"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { buildChatSessionPath } from "@/routes/helpers"
import { useAppDispatch } from "@/store/hooks"
import type { MenuItem } from "../../types"

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
  // const currentChatSessionId = useAppSelector(selectCurrentChatSessionId)
  const { chatSessionId: currentChatSessionId } = useParams() // FIXME:
  const items: MenuItem[] = sessions.map((session) => ({
    id: session.id,
    title: session.id.slice(0, 6), // TODO: use createdAt as name
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
      <CreateSessionButton />
    </SidebarMenuSub>
  )
}

function CreateSessionButton() {
  const { admin } = useAbility()
  const dispatch = useAppDispatch()
  const handleClick = () => {
    if (admin) dispatch(createPlaygroundSession())
    dispatch(createAppSession())
  }
  // FIXME: i18n
  return (
    <SidebarMenuSubButton onClick={handleClick} className="cursor-default">
      <MessageSquarePlusIcon />
      <span>New Chat Session</span>
    </SidebarMenuSubButton>
  )
}
