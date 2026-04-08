import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { buildSince } from "@/common/utils/build-date"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { useBuildPath } from "@/hooks/use-build-path"
import { GridItem } from "@/studio/components/grid/Grid"

export function AgentItem({
  agent,
  organizationId,
  projectId,
}: {
  agent: Agent
  organizationId: string
  projectId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("agent", {
      organizationId,
      projectId,
      agentId: agent.id,
    })
    navigate(path)
  }

  const Icon = getAgentIcon(agent.type)

  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>
          <Icon className="size-4" />
          {agent.name}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("actions:open")}</Button>
      </ItemActions>
    </Item>
  )
}

export function AgentItem2({
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
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("agent", {
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
