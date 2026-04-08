import type { Agent } from "@/common/features/agents/agents.models"
import { AgentList } from "@/common/features/agents/components/AgentList"
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
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { AgentCreatorButton } from "@/studio/features/agents/components/AgentCreator"
import {
  ConversationAgentSessionList,
  ExtractionAgentSessionList,
  FormAgentSessionList,
} from "@/studio/features/agents/components/AgentSessionList"
import { AnalyticsButton } from "@/studio/features/agents/components/AnalyticsButton"
import { DocumentsButton } from "@/studio/features/agents/components/DocumentsButton"
import { EvaluationButton } from "@/studio/features/agents/components/EvaluationButton"
import { MembersButton } from "@/studio/features/agents/components/MembersButton"
import { ProjectDeletor } from "@/studio/features/projects/components/ProjectDeletor"
import { ProjectEditor } from "@/studio/features/projects/components/ProjectEditor"
import { AgentMembershipsRoute } from "./AgentMembershipsRoute"
import { AnalyticsRoute } from "./AnalyticsRoute"
import { DocumentsRoute } from "./DocumentsRoute"
import { EvaluationRoute } from "./EvaluationRoute"
import { FeedbackRoute } from "./FeedbackRoute"
import { buildStudio2Path, buildStudioPath, StudioRouteNames } from "./helpers"
import { ProjectMembershipsRoute } from "./ProjectMembershipsRoute"
import { StudioAgentSessionRoute } from "./StudioAgentSessionRoute"
import { StudioDashboardRoute, StudioDashboardRoute2 } from "./StudioDashboardRoute"
import { Studio } from "./StudioRoute"

const extraItems = [
  AgentCreatorButton,
  DocumentsButton,
  MembersButton,
  AnalyticsButton,
  EvaluationButton,
]

export const studioRoutes = {
  path: StudioRouteNames.STUDIO,
  element: (
    <ProtectedRoute>
      <Studio />
    </ProtectedRoute>
  ),
  children: [
    {
      path: buildStudioPath(RouteNames.ORGANIZATION_DASHBOARD),
      element: (
        <DashboardRoute>
          {(user, projects, organization) => (
            <StudioDashboardRoute user={user} projects={projects} organization={organization} />
          )}
        </DashboardRoute>
      ),
      children: [
        {
          path: buildStudioPath(RouteNames.PROJECT),
          element: (
            <ProjectRoute>
              {(agents, project) => (
                <AgentList
                  extraItems={extraItems.length}
                  action={
                    <>
                      <ProjectEditor project={project} />
                      <ProjectDeletor project={project} />
                    </>
                  }
                  project={project}
                  agents={agents}
                >
                  {extraItems.map((Component, index) => (
                    <Component
                      key={`${Component.name}-${index}`}
                      project={project}
                      index={agents.length + index}
                    />
                  ))}
                </AgentList>
              )}
            </ProjectRoute>
          ),
          children: [
            {
              path: buildStudioPath(StudioRouteNames.EVALUATION),
              element: (
                <RestrictedFeature feature="evaluation">
                  <EvaluationRoute />
                </RestrictedFeature>
              ),
            },
            {
              path: buildStudioPath(StudioRouteNames.DOCUMENTS),
              element: <DocumentsRoute />,
            },
            {
              path: buildStudioPath(StudioRouteNames.ANALYTICS),
              element: (
                <RestrictedFeature feature="project-analytics">
                  <AnalyticsRoute />
                </RestrictedFeature>
              ),
            },
            {
              path: buildStudioPath(StudioRouteNames.PROJECT_MEMBERSHIPS),
              element: <ProjectMembershipsRoute />,
            },
            {
              path: buildStudioPath(RouteNames.AGENT),
              element: <AgentRoute>{(agent) => <AgentHandler agent={agent} />}</AgentRoute>,
              children: [
                {
                  path: buildStudioPath(RouteNames.AGENT_SESSION),
                  element: (
                    <AgentSessionRoute>
                      {(agent, agentSession, messages) => (
                        <StudioAgentSessionRoute
                          agent={agent}
                          agentSession={agentSession}
                          messages={messages}
                        />
                      )}
                    </AgentSessionRoute>
                  ),
                },
                {
                  path: buildStudioPath(StudioRouteNames.FEEDBACK),
                  element: <FeedbackRoute />,
                },
                {
                  path: buildStudioPath(StudioRouteNames.AGENT_MEMBERSHIPS),
                  element: <AgentMembershipsRoute />,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const studio2Routes = {
  path: StudioRouteNames.STUDIO2,
  element: (
    <ProtectedRoute>
      <Studio />
    </ProtectedRoute>
  ),
  children: [
    {
      path: buildStudio2Path(RouteNames.ORGANIZATION_DASHBOARD),
      element: (
        <DashboardRoute>
          {(user, projects, organization) => (
            <StudioDashboardRoute2 user={user} projects={projects} organization={organization} />
          )}
        </DashboardRoute>
      ),
      children: [
        {
          path: buildStudio2Path(RouteNames.PROJECT),
          element: (
            <ProjectRoute>
              {(agents, project) => <AgentList project={project} agents={agents} />}
            </ProjectRoute>
          ),
          children: [
            {
              path: buildStudio2Path(StudioRouteNames.EVALUATION),
              element: (
                <RestrictedFeature feature="evaluation">
                  <EvaluationRoute />
                </RestrictedFeature>
              ),
            },
            {
              path: buildStudio2Path(StudioRouteNames.DOCUMENTS),
              element: <DocumentsRoute />,
            },
            {
              path: buildStudio2Path(StudioRouteNames.ANALYTICS),
              element: (
                <RestrictedFeature feature="project-analytics">
                  <AnalyticsRoute />
                </RestrictedFeature>
              ),
            },
            {
              path: buildStudio2Path(StudioRouteNames.PROJECT_MEMBERSHIPS),
              element: <ProjectMembershipsRoute />,
            },
            {
              path: buildStudio2Path(RouteNames.AGENT),
              element: <AgentRoute>{(agent) => <AgentHandler agent={agent} />}</AgentRoute>,
              children: [
                {
                  path: buildStudio2Path(RouteNames.AGENT_SESSION),
                  element: (
                    <AgentSessionRoute>
                      {(agent, agentSession, messages) => (
                        <StudioAgentSessionRoute
                          agent={agent}
                          agentSession={agentSession}
                          messages={messages}
                        />
                      )}
                    </AgentSessionRoute>
                  ),
                },
                {
                  path: buildStudio2Path(StudioRouteNames.FEEDBACK),
                  element: <FeedbackRoute />,
                },
                {
                  path: buildStudio2Path(StudioRouteNames.AGENT_MEMBERSHIPS),
                  element: <AgentMembershipsRoute />,
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
