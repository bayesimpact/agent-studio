import { Button } from "@caseai-connect/ui/shad/button"
import { SidebarMenuSubButton } from "@caseai-connect/ui/shad/sidebar"
import throttle from "lodash/throttle"
import { PlusCircleIcon, PlusIcon } from "lucide-react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/common/features/agents/agents.models"
import { useAppDispatch } from "@/common/store/hooks"
import { useBuildPath } from "@/hooks/use-build-path"
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
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const onSuccess = useCallback(
    (agentSessionId: string) => {
      const path = buildPath("agentSession", { ...ids, agentSessionId })
      navigate(path)
    },
    [buildPath, ids, navigate],
  )

  const handleClick = useMemo(
    () =>
      throttle(
        () => {
          dispatch(createAgentSession({ agentType, agentId: ids.agentId, onSuccess }))
        },
        2000,
        { trailing: false },
      ),
    [agentType, ids.agentId, dispatch, onSuccess],
  )
  if (type === "button") {
    return (
      <Button size="lg" className="text-base" onClick={handleClick}>
        {t("actions:create")}
        <PlusCircleIcon className="ml-2 size-5" />
      </Button>
    )
  }
  return (
    <SidebarMenuSubButton onClick={handleClick} className="cursor-pointer">
      <PlusIcon />
      <span>{t(`${agentType}AgentSession:create.button`)}</span>
    </SidebarMenuSubButton>
  )
}
