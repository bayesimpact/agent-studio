import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { AgentCreator } from "@/features/agents/components/AgentCreator"
import { AgentDeletorWithoutTrigger } from "@/features/agents/components/AgentDeletor"
import { AgentEditorWithoutTrigger } from "@/features/agents/components/AgentEditor"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { AgentItemOptions } from "@/features/agents/components/AgentItemOptions"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { NavAgentMemberships } from "../nav/NavAgentMemberships"
import { AppNavItem } from "../nav/NavItem"
import { SidebarAgentSessionList } from "./SidebarAgentSessionList"

export function SidebarAgentList({
  organizationId,
  project,
  isAdminInterface,
}: {
  project: Project
  organizationId: string
  isAdminInterface: boolean
}) {
  const agents = useAppSelector(selectAgentsData)

  if (!ADS.isFulfilled(agents)) return null
  if (agents.value.length === 0) return null

  return (
    <AgentList
      organizationId={organizationId}
      project={project}
      agents={agents.value}
      isAdminInterface={isAdminInterface}
    />
  )
}

type Item = { action: "edit" | "delete"; value: Agent }

export function AgentList({
  organizationId,
  project,
  agents,
  isAdminInterface,
}: {
  isAdminInterface: boolean
  organizationId: string
  project: Project
  agents: Agent[]
}) {
  const { t } = useTranslation()
  const { agentId: urlagentId } = useParams()
  const { buildPath } = useBuildPath()

  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)

  return (
    <SidebarGroup>
      <div className="flex items-center gap-2">
        <SidebarGroupLabel className="uppercase">
          {t(agents.length === 1 ? "agent:agent" : "agent:agents")}
        </SidebarGroupLabel>

        {isAdminInterface && (
          <SidebarGroupAction>
            <AgentCreatorButton project={project} />
          </SidebarGroupAction>
        )}
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
              itemOptions={
                isAdminInterface && (
                  <AgentItemOptions
                    onEdit={() => handleItem({ action: "edit", value: agent })}
                    onDelete={() => handleItem({ action: "delete", value: agent })}
                  />
                )
              }
            >
              {agent.type !== "extraction" && (
                <SidebarAgentSessionList
                  ids={{ organizationId, projectId: project.id, agentId: agent.id }}
                  agentType={agent.type}
                />
              )}
            </AppNavItem>

            {isAdminInterface && (
              <NavAgentMemberships
                organizationId={project.organizationId}
                projectId={project.id}
                agentId={agent.id}
              />
            )}

            <div className="mr-4 mb-2 mt-1">
              <SidebarSeparator />
            </div>
          </SidebarMenu>
        ))}

        {isAdminInterface && (
          <>
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
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AgentCreatorButton({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <PlusIcon onClick={() => setOpen(true)} />
      <AgentCreator project={project} open={open} onOpenChange={setOpen} />
    </>
  )
}
