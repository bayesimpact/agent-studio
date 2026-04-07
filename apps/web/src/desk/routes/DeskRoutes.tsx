import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { AgentRoute } from "@/common/routes/AgentRoute"
import { AgentSessionRoute } from "@/common/routes/agents/AgentSessionRoute"
import { ConversationAgentRoute } from "@/common/routes/agents/ConversationAgentRoute"
import { ExtractionAgentRoute } from "@/common/routes/agents/ExtractionAgentRoute"
import { FormAgentRoute } from "@/common/routes/agents/FormAgentRoute"
import { DashboardRoute } from "@/common/routes/DashboardRoute"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import { RouteNames } from "@/common/routes/helpers"
import { ProjectRoute } from "@/common/routes/ProjectRoute"
import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { useAppSelector } from "@/common/store/hooks"
import { Loader } from "@/components/Loader"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { AgentList } from "@/features/agents/components/AgentList"
import { ConversationAgentSessionItem } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionItem"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { ExtractionSessionCreator } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionCreator"
import { ExtractionSessionItem } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionItem"
import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { selectIsProcessingExecution } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.selectors"
import { FormAgentSessionItem } from "@/features/agents/form-agent-sessions/components/FormAgentSessionItem"
import { FormResult } from "@/features/agents/form-agent-sessions/components/FormResult"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { AgentSessionMessages } from "@/features/agents/shared/agent-session-messages/components/AgentSessionMessages"
import { BaseAgentSessionCreator } from "@/features/agents/shared/base-agent-session/components/BaseAgentSessionCreator"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useBuildDeskPath, useDeskGetPath } from "../hooks/use-desk-build-path"
import { DeskDashboardRoute } from "./DeskDashboardRoute"
import { buildDeskPath, DeskRouteNames } from "./helpers"

export const deskRoutes = {
  path: DeskRouteNames.APP,
  element: (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  ),
  children: [
    {
      path: buildDeskPath(RouteNames.ORGANIZATION_DASHBOARD),
      element: (
        <DashboardRoute>
          {(user, projects, organization) => (
            <DeskDashboardRoute user={user} projects={projects} organization={organization} />
          )}
        </DashboardRoute>
      ),
      children: [
        {
          path: buildDeskPath(RouteNames.PROJECT),
          element: (
            <ProjectRoute>
              {(agents, project) => <AgentList project={project} agents={agents} />}
            </ProjectRoute>
          ),
          children: [
            {
              path: buildDeskPath(RouteNames.AGENT),
              element: <AgentRoute>{(agent) => <AgentHandler agent={agent} />}</AgentRoute>,
              children: [
                {
                  path: buildDeskPath(RouteNames.AGENT_SESSION),
                  element: (
                    <AgentSessionRoute>
                      {(agent, agentSession, messages) => (
                        <DeskAgentSessionRoute
                          agent={agent}
                          agentSession={agentSession}
                          messages={messages}
                        />
                      )}
                    </AgentSessionRoute>
                  ),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function AgentHandler({ agent }: { agent: Agent }) {
  switch (agent.type) {
    case "conversation":
      return (
        <ConversationAgentRoute>
          {(agentSessions) => (
            <ConversationAgentSessionList agentSessions={agentSessions} agent={agent} />
          )}
        </ConversationAgentRoute>
      )
    case "form":
      return (
        <FormAgentRoute>
          {(agentSessions) => <FormAgentSessionList agentSessions={agentSessions} agent={agent} />}
        </FormAgentRoute>
      )
    case "extraction":
      return (
        <ExtractionAgentRoute>
          {(agentSessions) => (
            <ExtractionAgentSessionList agentSessions={agentSessions} agent={agent} />
          )}
        </ExtractionAgentRoute>
      )
    default:
      return <ErrorRoute error={"Unknown agent type"} />
  }
}

function ConversationAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: ConversationAgentSession[]
}) {
  const { t } = useTranslation()
  const { getDeskPath } = useDeskGetPath()
  const outlet = useOutlet()

  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return <Outlet />
  return (
    <ListHeader
      path={getDeskPath("agent")}
      title={t("conversationAgentSession:list.title")}
      agent={agent}
    >
      <BaseAgentSessionCreator
        agentType="conversation"
        type="button"
        ids={{ organizationId, projectId, agentId: agent.id }}
      />

      {agentSessions.map((agentSession) => (
        <ConversationAgentSessionItem
          key={agentSession.id}
          organizationId={organizationId}
          projectId={projectId}
          agentId={agent.id}
          agentSession={agentSession}
        />
      ))}
    </ListHeader>
  )
}

function FormAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: FormAgentSession[]
}) {
  const { t } = useTranslation()
  const { getDeskPath } = useDeskGetPath()
  const outlet = useOutlet()

  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return <Outlet />
  return (
    <ListHeader path={getDeskPath("agent")} title={t("formAgentSession:list.title")} agent={agent}>
      <BaseAgentSessionCreator
        agentType="form"
        type="button"
        ids={{ organizationId, projectId, agentId: agent.id }}
      />

      {agentSessions.map((agentSession) => (
        <FormAgentSessionItem
          key={agentSession.id}
          organizationId={organizationId}
          projectId={projectId}
          agentId={agent.id}
          agentSession={agentSession}
        />
      ))}
    </ListHeader>
  )
}

function ExtractionAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: ExtractionAgentSessionSummary[]
}) {
  const outlet = useOutlet()
  const { buildDeskPath } = useBuildDeskPath()
  const { t } = useTranslation("extractionAgentSession", { keyPrefix: "list" })
  const isProcessingExecution = useAppSelector(selectIsProcessingExecution)
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return <Outlet />
  return (
    <ListHeader
      agent={agent}
      path={buildDeskPath("project", { organizationId, projectId })}
      title={t("title")}
    >
      {isProcessingExecution && <Loader />}

      <ExtractionSessionCreator disabled={isProcessingExecution} />

      {agentSessions.map((run) => (
        <ExtractionSessionItem key={run.id} run={run} />
      ))}
    </ListHeader>
  )
}

function DeskAgentSessionRoute({
  agentSession,
  messages,
  agent,
}: {
  agent: Agent
  agentSession: ConversationAgentSession | FormAgentSession
  messages: AgentSessionMessage[]
}) {
  return (
    <AgentSessionMessages
      session={agentSession}
      messages={messages}
      rightSlot={
        agent.type === "form" ? <FormResult agent={agent} agentSession={agentSession} /> : undefined
      }
    />
  )
}
