import { Button } from "@caseai-connect/ui/shad/button"
import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { createAgentSession } from "@/features/agent-sessions/agent-sessions.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function CreateAgentSession({
  type,
  agentId,
  projectId,
  organizationId,
}: {
  type: "button" | "menu"
  agentId: string
  projectId: string
  organizationId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation("agentSession", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const onSuccess = (agentSessionId: string) => {
    const path = buildPath("agentSession", { organizationId, projectId, agentId, agentSessionId })
    navigate(path)
  }
  const handleClick = () => {
    dispatch(createAgentSession({ organizationId, projectId, agentId, onSuccess }))
  }
  const Comp = type === "button" ? Button : SidebarMenuSubButton
  return (
    <Comp onClick={handleClick} className="cursor-pointer">
      <PlusIcon />
      <span>{t("button")}</span>
    </Comp>
  )
}
