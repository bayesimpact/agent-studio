import { Button } from "@caseai-connect/ui/shad/button"
import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"
import { createAgentSession } from "../base-agent-sessions.thunks"

export function BaseAgentSessionCreator({
  agentType,
  type,
  ids,
}: {
  agentType: Agent["type"]
  type: "button" | "menu"
  ids: { agentId: string; projectId: string; organizationId: string }
}) {
  const navigate = useNavigate()
  const { t } = useTranslation(`${agentType}AgentSession`, { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const onSuccess = (agentSessionId: string) => {
    const path = buildPath("agentSession", { ...ids, agentSessionId })
    navigate(path)
  }
  const handleClick = () => {
    dispatch(createAgentSession({ agentType, agentId: ids.agentId, onSuccess }))
  }
  const Comp = type === "button" ? Button : SidebarMenuSubButton
  return (
    <Comp onClick={handleClick} className="cursor-pointer">
      <PlusIcon />
      <span>{t("button")}</span>
    </Comp>
  )
}
