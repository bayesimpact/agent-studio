import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { useAppDispatch } from "@/store/hooks"

export function CreateChatSession() {
  const { admin } = useAbility()
  const { t } = useTranslation("chatSession", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const handleClick = () => {
    if (admin) dispatch(createPlaygroundSession())
    else dispatch(createAppSession())
  }
  return (
    <SidebarMenuSubButton onClick={handleClick} className="cursor-default">
      <PlusIcon />
      <span>{t("button")}</span>
    </SidebarMenuSubButton>
  )
}
