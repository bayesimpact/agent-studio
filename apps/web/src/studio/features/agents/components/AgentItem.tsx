import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { buildSince } from "@/common/utils/build-date"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { GridItem } from "@/studio/components/grid/Grid"
import { useBuildStudioPath } from "@/studio/hooks/use-studio-build-path"

export function AgentItem({
  agent,
  organizationId,
  projectId,
  className,
  index,
}: {
  index: number
  className?: string
  agent: Agent
  organizationId: string
  projectId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildStudioPath } = useBuildStudioPath()
  const handleClick = () => {
    const path = buildStudioPath("agent", {
      organizationId,
      projectId,
      agentId: agent.id,
    })
    navigate(path)
  }

  const Icon = getAgentIcon(agent.type)

  const date = buildSince(agent.updatedAt)
  return (
    <GridItem
      className={className}
      badge={t(`agent:create.typeDialog.${agent.type}`)}
      onClick={handleClick}
      title={
        <>
          <Icon />
          {agent.name}
        </>
      }
      description={date}
      index={index}
    />
  )
}
