import { SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { BotIcon } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { AgentCreatorWithTrigger } from "@/components/agent/AgentCreator"
import { AgentItemOptions } from "@/components/agent/AgentItemOptions"
import { DeleteAgentDialogWithOutTrigger } from "@/components/agent/DeleteAgentDialog"
import { EditAgentDialogWithOutTrigger } from "@/components/agent/EditAgentDialog"
import type { Agent } from "@/features/agents/agents.models"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { AppNavItem } from "../nav/NavItem"
import { AgentSessionList } from "./AgentSessionList"

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
            url: buildPath("agent", {
              organizationId,
              projectId: project.id,
              agentId: agent.id,
            }),
            isActive: urlagentId === agent.id,
            icon: BotIcon,
          }}
          itemOptions={
            <AgentItemOptions
              onEdit={() => handleItem({ action: "edit", value: agent })}
              onDelete={() => handleItem({ action: "delete", value: agent })}
            />
          }
        >
          <AgentSessionList
            organizationId={organizationId}
            agentId={agent.id}
            projectId={agent.projectId}
          />
        </AppNavItem>
      ))}

      <SidebarMenuItem>
        <AgentCreatorWithTrigger project={project} />
      </SidebarMenuItem>

      <EditAgentDialogWithOutTrigger
        organizationId={organizationId}
        agent={item?.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <DeleteAgentDialogWithOutTrigger
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
            url: buildPath("agent", {
              organizationId,
              projectId,
              agentId: agent.id,
            }),
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
