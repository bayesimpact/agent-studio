import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from "@caseai-connect/ui/shad/sidebar"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { AppNavItem } from "../nav/NavItem"
import { SidebarAgentSessionList } from "./SidebarAgentSessionList"

export function SidebarAgentList({
  organizationId,
  project,
  action,
}: {
  project: Project | null
  organizationId: string
  action?: React.ReactNode
}) {
  const agents = useAppSelector(selectAgentsData)

  if (!ADS.isFulfilled(agents) || !project) return null

  return (
    <AgentList
      action={action}
      organizationId={organizationId}
      project={project}
      agents={agents.value}
    />
  )
}

export function AgentList({
  organizationId,
  project,
  agents,
  action,
}: {
  organizationId: string
  project: Project
  agents: Agent[]
  action?: React.ReactNode
}) {
  const { t } = useTranslation()
  const { agentId: urlagentId } = useParams()
  const { buildPath } = useBuildPath()

  return (
    <SidebarGroup>
      <div className="flex items-center gap-2">
        <SidebarGroupLabel className="uppercase flex-1">
          {t(agents.length === 1 ? "agent:agent" : "agent:agents")}
        </SidebarGroupLabel>
        {action}
      </div>

      <SidebarGroupContent>
        {agents.map((agent) => (
          <SidebarMenu key={agent.id}>
            <AppNavItem
              item={{
                id: agent.id,
                title: agent.name,
                url: buildPath("agent", {
                  organizationId,
                  projectId: project.id,
                  agentId: agent.id,
                }),
                isActive: urlagentId === agent.id,
                icon: getAgentIcon(agent.type),
              }}
            >
              {agent.type !== "extraction" && (
                <SidebarAgentSessionList
                  organizationId={organizationId}
                  projectId={project.id}
                  agentId={agent.id}
                  agentType={agent.type}
                />
              )}
            </AppNavItem>

            <div className="mr-4 mb-2 mt-1">
              <SidebarSeparator />
            </div>
          </SidebarMenu>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
