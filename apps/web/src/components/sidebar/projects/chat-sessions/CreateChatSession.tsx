import { Button } from "@caseai-connect/ui/shad/button"
import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { createChatSession } from "@/features/chat-sessions/chat-sessions.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function CreateChatSession({ type }: { type: "button" | "menu" }) {
  const navigate = useNavigate()
  const { t } = useTranslation("chatSession", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const onSuccess = (chatSessionId: string) => {
    navigate(buildPath("chatSession", { chatSessionId }))
  }
  const handleClick = () => {
    dispatch(createChatSession({ onSuccess }))
  }
  const Comp = type === "button" ? Button : SidebarMenuSubButton
  return (
    <Comp onClick={handleClick} className="cursor-default">
      <PlusIcon />
      <span>{t("button")}</span>
    </Comp>
  )
}
