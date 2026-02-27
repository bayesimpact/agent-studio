import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, PlusIcon, ScanText } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { AgentCreator } from "@/components/agent/AgentCreator"
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
            url: buildPath("agent", { organizationId, projectId: project.id, agentId: agent.id }),
            isActive: urlagentId === agent.id,
            icon: getAgentIcon(agent.type),
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

      <AgentCreatorButton project={project} />

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

function AgentCreatorButton({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)

  return (
    <SidebarMenuItem>
      <div>
        <SidebarMenuButton className="cursor-pointer" onClick={() => setOpen(true)}>
          <PlusIcon />
          <span>{t("button")}</span>
        </SidebarMenuButton>
        <AgentCreator project={project} open={open} onOpenChange={setOpen} />
      </div>
    </SidebarMenuItem>
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
            url: buildPath("agent", { organizationId, projectId, agentId: agent.id }),
            isActive: urlagentId === agent.id,
            icon: getAgentIcon(agent.type),
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

function getAgentIcon(agentType: Agent["type"]) {
  return agentType === "extraction" ? ScanText : BotIcon
}
