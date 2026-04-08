import { cn } from "@caseai-connect/ui/utils"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import type { ConversationAgentSession } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import type { ExtractionAgentSessionSummary } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.models"
import { selectIsProcessingExecution } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.selectors"
import type { FormAgentSession } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.models"
import type { Agent } from "@/common/features/agents/agents.models"
import { getAgentIcon } from "@/common/features/agents/components/AgentIcon"
import { AgentSessionItem } from "@/common/features/agents/components/AgentSessionItem"
import { ExtractionSessionCreator } from "@/common/features/agents/components/ExtractionAgentSessionCreator"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useGetPath } from "@/common/hooks/use-build-path"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import { useAppSelector } from "@/common/store/hooks"
import { ExtractionSessionItem } from "../../../../common/features/agents/components/ExtractionAgentSessionItem"
import { AgentActions } from "./AgentActions"
import { AgentSessionListHeader } from "./AgentSessionListHeader"

export function ConversationAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: ConversationAgentSession[]
}) {
  const outlet = useOutlet()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return outlet

  return (
    <>
      <AgentSessionListHeader
        agent={agent}
        withBorderBottom={agentSessions.length > 0}
        backTo={outlet ? "agent" : "project"}
        organizationId={organizationId}
        projectId={projectId}
      />

      <Grid cols={3} total={agentSessions.length}>
        <GridContent>
          {agentSessions.map((session, index) => (
            <AgentSessionItem
              index={index}
              key={session.id}
              organizationId={organizationId}
              projectId={projectId}
              agentSession={session}
              agentId={agent.id}
            />
          ))}
        </GridContent>
      </Grid>
    </>
  )
}

export function FormAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: FormAgentSession[]
}) {
  const outlet = useOutlet()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return outlet
  return (
    <>
      <AgentSessionListHeader
        agent={agent}
        withBorderBottom={agentSessions.length > 0}
        backTo={outlet ? "agent" : "project"}
        organizationId={organizationId}
        projectId={projectId}
      />

      <Grid cols={3} total={agentSessions.length}>
        <GridContent>
          {agentSessions.map((session, index) => (
            <AgentSessionItem
              index={index}
              key={session.id}
              organizationId={organizationId}
              projectId={projectId}
              agentSession={session}
              agentId={agent.id}
            />
          ))}
        </GridContent>
      </Grid>
    </>
  )
}

export function ExtractionAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: ExtractionAgentSessionSummary[]
}) {
  const outlet = useOutlet()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getPath } = useGetPath()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const isProcessingExecution = useAppSelector(selectIsProcessingExecution)

  const handleBack = () => {
    const path = getPath("project")
    navigate(path)
  }

  const Icon = getAgentIcon(agent.type)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return outlet
  return (
    <Grid cols={0} total={0}>
      <GridHeader
        onBack={handleBack}
        title={agent.name}
        description={
          isProcessingExecution ? (
            <div className="flex items-center gap-1 text-primary">
              {t("status:loading")} <Loader2Icon className="animate-spin" />
            </div>
          ) : (
            <>
              <span className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</span>
              <Icon />
            </>
          )
        }
        action={<AgentActions agent={agent} organizationId={organizationId} />}
      />
      <div className="flex flex-col">
        <GridItem
          className={cn(
            "bg-muted/35 border-r-0 col-span-full",
            agentSessions.length > 0 && "border-b",
          )}
          title={t("extractionAgentSession:create.title")}
          description={t("extractionAgentSession:create.description")}
          action={<ExtractionSessionCreator disabled={isProcessingExecution} />}
        />

        {agentSessions.map((session, index) => (
          <ExtractionSessionItem
            className={cn(index === agentSessions.length - 1 ? "" : "border-b")}
            key={session.id}
            agentSession={session}
          />
        ))}
      </div>
    </Grid>
  )
}
