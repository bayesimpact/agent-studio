import { Outlet } from "react-router-dom"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentList } from "@/common/features/agents/components/AgentList"
import type { Project } from "@/common/features/projects/projects.models"
import { useAbility } from "@/common/hooks/use-ability"
import { useFeatureFlags } from "@/common/hooks/use-feature-flags"
import { AgentRoute } from "@/common/routes/AgentRoute"
import { ConversationAgentRoute } from "@/common/routes/agents/ConversationAgentRoute"
import { ExtractionAgentRoute } from "@/common/routes/agents/ExtractionAgentRoute"
import { FormAgentRoute } from "@/common/routes/agents/FormAgentRoute"
import { DashboardRoute } from "@/common/routes/DashboardRoute"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import { RouteNames } from "@/common/routes/helpers"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { ProjectRoute } from "@/common/routes/ProjectRoute"
import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import {
  ConversationAgentSessionList,
  ExtractionAgentSessionList,
  FormAgentSessionList,
} from "../features/agents/components/AgentSessionList"
import { EvalDashboardRoute } from "./EvalDashboardRoute"
import { buildEvalPath, EvalRouteNames } from "./helpers"

export const evalRoutes = {
  path: EvalRouteNames.APP,
  element: (
    <ProtectedRoute>
      <EvalRoute />
    </ProtectedRoute>
  ),
  children: [
    {
      path: buildEvalPath(RouteNames.ORGANIZATION_DASHBOARD),
      element: (
        <DashboardRoute>
          {(user, projects, organization) => (
            <EvalDashboardRoute user={user} projects={projects} organization={organization} />
          )}
        </DashboardRoute>
      ),
      children: [
        {
          path: buildEvalPath(RouteNames.PROJECT),
          element: (
            <ProjectRoute>
              {(agents, project) => <ProjectRouteHandler agents={agents} project={project} />}
            </ProjectRoute>
          ),
          children: [
            {
              path: buildEvalPath(RouteNames.AGENT),
              element: <AgentRoute>{(agent) => <AgentHandler agent={agent} />}</AgentRoute>,
              // FIXME: children: [
              //   {
              //     path: buildEvalPath(RouteNames.AGENT_SESSION),
              //     element: (
              //       <AgentSessionRoute>
              //         {(agent, agentSession, messages) => (
              //           <EvalAgentSessionRoute
              //             agent={agent}
              //             agentSession={agentSession}
              //             messages={messages}
              //           />
              //         )}
              //       </AgentSessionRoute>
              //     ),
              //   },
              // ],
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

function EvalRoute() {
  const { isPremiumMember } = useAbility()
  if (!isPremiumMember) return <NotFoundRoute redirectToHome />
  return <Outlet />
}

function ProjectRouteHandler({ agents, project }: { agents: Agent[]; project: Project }) {
  const { hasFeature } = useFeatureFlags()
  if (hasFeature("evaluation")) return <AgentList project={project} agents={agents} />
  return <NotFoundRoute redirectToHome />
}
