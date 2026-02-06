"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { SidebarMenuAction, SidebarMenuItem, useSidebar } from "@caseai-connect/ui/shad/sidebar"
import { BotIcon, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { CreateAgentDialogWithTrigger } from "@/components/agents/CreateAgentDialog"
import { DeleteAgentDialogWithOutTrigger } from "@/components/agents/DeleteAgentDialog"
import { EditAgentDialogWithOutTrigger } from "@/components/agents/EditAgentDialog"
import type { Agent } from "@/features/agents/agents.models"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { AppNavItem } from "../../NavItem"
import { AgentSessionList } from "../agent-sessions/AgentSessionList"

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
            <AgentOptions
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
        <CreateAgentDialogWithTrigger project={project} />
      </SidebarMenuItem>

      <EditAgentDialogWithOutTrigger
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

function AgentOptions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { isMobile } = useSidebar()
  const { t } = useTranslation("agent", { keyPrefix: "list.actions" })
  const { t: tCommon } = useTranslation("common")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover>
          <MoreHorizontal />
          <span className="sr-only">{tCommon("more")}</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="text-muted-foreground" />
          <span>{t("edit")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="text-muted-foreground" />
          <span>{t("delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
