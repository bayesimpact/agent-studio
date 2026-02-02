import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  createAppSession,
  createPlaygroundSession,
} from "@/features/chat-sessions/chat-sessions.thunks"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function CreateChatSession() {
  const navigate = useNavigate()
  const { admin } = useAbility()
  const { t } = useTranslation("chatSession", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const callback = (chatSessionId: string) => {
    navigate(buildPath("chatSession", { chatSessionId }))
  }
  const handleClick = () => {
    if (admin) dispatch(createPlaygroundSession({ callback }))
    else dispatch(createAppSession({ callback }))
  }
  return (
    <SidebarMenuSubButton onClick={handleClick} className="cursor-default">
      <PlusIcon />
      <span>{t("button")}</span>
    </SidebarMenuSubButton>
  )
}
