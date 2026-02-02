import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { MessageSquarePlusIcon } from "lucide-react"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { useAppDispatch } from "@/store/hooks"

export function CreateChatSession() {
  const { admin } = useAbility()
  const dispatch = useAppDispatch()
  const handleClick = () => {
    if (admin) dispatch(createPlaygroundSession())
    else dispatch(createAppSession())
  }
  // FIXME: i18n
  return (
    <SidebarMenuSubButton onClick={handleClick} className="cursor-default">
      <MessageSquarePlusIcon />
      <span>New Chat Session</span>
    </SidebarMenuSubButton>
  )
}
