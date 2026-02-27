import { SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, ScanText } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { AgentCreatorWithTrigger } from "@/components/agent/AgentCreator"
import { AgentDeletorWithoutTrigger } from "@/components/agent/AgentDeletor"
import { AgentEditorWithoutTrigger } from "@/components/agent/AgentEditor"
import { AgentItemOptions } from "@/components/agent/AgentItemOptions"
import type { Agent } from "@/features/agents/agents.models"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { AppNavItem } from "../nav/NavItem"
import { AgentSessionList } from "./SidebarAgentSessionList"

type Item = { action: "edit" | "delete"; value: Agent }

export function AdminAgentList({
  organizationId,
  project,
  agents,
}: {
  organizationId: string
  project: Project
  agents: Agent[]
}) {
  const { agentId: urlagentId } = useParams()

  const { buildPath } = useBuildPath()

  const [item, setItem] = useState<Item | null>(null)

  const handleItem = (item: Item) => setItem(item)

  const handleClose = () => {
    setItem(null)
  }
  return (
    <>
      {agents.map((agent) => (
        <AppNavItem
          key={agent.id}
          item={{
            id: agent.id,
            title: agent.name,
            url: getAgentPath({ buildPath, organizationId, projectId: project.id, agent }),
            isActive: urlagentId === agent.id,
            icon: getAgentIcon(agent),
          }}
          itemOptions={
            <AgentItemOptions
              onEdit={() => handleItem({ action: "edit", value: agent })}
              onDelete={() => handleItem({ action: "delete", value: agent })}
            />
          }
        >
          {agent.type === "conversation" ? (
            <AgentSessionList
              organizationId={organizationId}
              agentId={agent.id}
              projectId={agent.projectId}
            />
          ) : null}
        </AppNavItem>
      ))}

      <SidebarMenuItem>
        <AgentCreatorWithTrigger project={project} />
      </SidebarMenuItem>

      <AgentEditorWithoutTrigger
        agent={item?.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <AgentDeletorWithoutTrigger
        organizationId={organizationId}
        projectId={project.id}
        agent={item?.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </>
  )
}

export function AppAgentList({
  organizationId,
  projectId,
  agents,
}: {
  organizationId: string
  projectId: string
  agents: Agent[]
}) {
  const { agentId: urlagentId } = useParams()
  const { buildPath } = useBuildPath()
  return (
    <>
      {agents.map((agent) => (
        <AppNavItem
          key={agent.id}
          item={{
            id: agent.id,
            title: agent.name,
            url: getAgentPath({ buildPath, organizationId, projectId, agent }),
            isActive: urlagentId === agent.id,
            icon: BotIcon,
          }}
        >
          <AgentSessionList
            organizationId={organizationId}
            agentId={agent.id}
            projectId={projectId}
          />
        </AppNavItem>
      ))}
    </>
  )
}

function getAgentIcon(agent: Agent) {
  return agent.type === "extraction" ? ScanText : BotIcon
}

function getAgentPath({
  buildPath,
  organizationId,
  projectId,
  agent,
}: {
  buildPath: ReturnType<typeof useBuildPath>["buildPath"]
  organizationId: string
  projectId: string
  agent: Agent
}) {
  if (agent.type === "extraction") {
    return buildPath("extractionAgent", {
      organizationId,
      projectId,
      agentId: agent.id,
    })
  }

  return buildPath("agent", {
    organizationId,
    projectId,
    agentId: agent.id,
  })
}
