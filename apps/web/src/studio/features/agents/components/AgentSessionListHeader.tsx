import { cn } from "@caseai-connect/ui/utils"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { BaseAgentSessionCreator } from "@/features/agents/agent-sessions/shared/base-agent-session/components/BaseAgentSessionCreator"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { useGetPath } from "@/hooks/use-build-path"
import { Grid, GridContent, GridHeader, GridItem } from "@/studio/components/grid/Grid"
import { AgentActions } from "./AgentActions"
import { FeedbackButton } from "./FeedbackButton"

export function AgentSessionListHeader({
  agent,
  withBorderBottom,
  backTo,
  projectId,
  organizationId,
}: {
  projectId: string
  organizationId: string
  agent: Agent
  withBorderBottom: boolean
  backTo: "agent" | "project"
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getPath } = useGetPath()

  const handleBack = () => {
    const path = getPath(backTo)
    navigate(path)
  }

  const Icon = getAgentIcon(agent.type)

  return (
    <Grid cols={2} total={2}>
      <GridHeader
        onBack={handleBack}
        title={agent.name}
        description={
          <>
            <div className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</div>
            <Icon />
          </>
        }
        action={<AgentActions agent={agent} organizationId={organizationId} />}
      />

      <GridContent>
        <CreateButton
          index={0}
          agent={agent}
          organizationId={organizationId}
          projectId={projectId}
          withBorderBottom={withBorderBottom}
        />

        <FeedbackButton
          index={1}
          agentId={agent.id}
          organizationId={organizationId}
          projectId={projectId}
          withBorderBottom={withBorderBottom}
        />
      </GridContent>
    </Grid>
  )
}

function CreateButton({
  agent,
  organizationId,
  projectId,
  withBorderBottom,
  index,
}: {
  index: number
  agent: Agent
  organizationId: string
  projectId: string
  withBorderBottom?: boolean
}) {
  const { t } = useTranslation()
  const prefix = `${agent.type}AgentSession`
  return (
    <GridItem
      className={cn("bg-muted/35", withBorderBottom && "border-b")}
      index={index}
      title={t(`${prefix}:create.title`)}
      description={t(`${prefix}:create.description`)}
      action={
        <BaseAgentSessionCreator
          agentType={agent.type}
          type="button"
          ids={{ organizationId, projectId, agentId: agent.id }}
        />
      }
    />
  )
}
