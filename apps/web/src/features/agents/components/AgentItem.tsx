import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { getAgentIcon } from "./AgentIcon"

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
