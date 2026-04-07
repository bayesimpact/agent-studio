import { cn } from "@caseai-connect/ui/utils"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { ExtractionSessionCreator } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionCreator"
import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { selectIsProcessingExecution } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { Grid, GridHeader, GridItem } from "@/studio/components/grid/Grid"
import { ExtractionSessionItem } from "@/studio/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionItem"
import { useGetStudioPath } from "@/studio/hooks/use-studio-build-path"
import { AgentActions } from "../../components/AgentActions"

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
  const { getStudioPath } = useGetStudioPath()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const isProcessingExecution = useAppSelector(selectIsProcessingExecution)

  const handleBack = () => {
    const path = getStudioPath("project")
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
