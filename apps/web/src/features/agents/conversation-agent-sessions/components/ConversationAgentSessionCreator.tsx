import { Button } from "@caseai-connect/ui/shad/button"
import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { createConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function ConversationAgentSessionCreator({
  type,
  ids,
}: {
  type: "button" | "menu"
  ids: { agentId: string; projectId: string; organizationId: string }
}) {
  const navigate = useNavigate()
  const { t } = useTranslation("conversationAgentSession", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const onSuccess = (agentSessionId: string) => {
    const path = buildPath("agentSession", { ...ids, agentSessionId })
    navigate(path)
  }
  const handleClick = () => {
    dispatch(createConversationAgentSession({ agentId: ids.agentId, onSuccess }))
  }
  const Comp = type === "button" ? Button : SidebarMenuSubButton
  return (
    <Comp onClick={handleClick} className="cursor-pointer">
      <PlusIcon />
      <span>{t("button")}</span>
    </Comp>
  )
}
