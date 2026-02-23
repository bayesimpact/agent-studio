"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { AdminAgentList, AppAgentList } from "./projects/agents/AgentList"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { ProjectOptions } from "./projects/ProjectOptions"

type Item = { action: "edit" | "delete"; value: ProjectDto }

export function AdminNavProject({
  organizationId,
  project,
}: {
  organizationId: string
  project: ProjectDto
}) {
  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)
  return (
    <>
      <ProjectItem
        key={project.id}
        project={project}
        options={
          <ProjectOptions
            onEdit={() => handleItem({ action: "edit", value: project })}
            onDelete={() => handleItem({ action: "delete", value: project })}
          />
        }
        showEmptyProject={true}
      >
        {({ agents }) => (
          <AdminAgentList organizationId={organizationId} agents={agents} project={project} />
        )}
      </ProjectItem>

      <EditProjectDialog
        project={item?.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <DeleteProjectDialog
        project={item?.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </>
  )
}

export function AppNavProject({
  organizationId,
  project,
}: {
  organizationId: string
  project: ProjectDto
}) {
  return (
    <ProjectItem key={project.id} project={project}>
      {({ agents }) => (
        <AppAgentList projectId={project.id} organizationId={organizationId} agents={agents} />
      )}
    </ProjectItem>
  )
}

function ProjectItem({
  project,
  children,
  options,
  showEmptyProject = false,
}: {
  project: ProjectDto
  children: (args: { agents: Agent[] }) => React.ReactNode
  options?: React.ReactNode
  showEmptyProject?: boolean
}) {
  const { t } = useTranslation("common")
  const agents = useAppSelector(selectAgentsFromProjectId(project.id))
  const name = `${t("project")} - ${project.name}`
  if (!ADS.isFulfilled(agents)) return <div>Error</div>
  if (agents.value.length === 0 && !showEmptyProject) return null
  return (
    <Section name={name} options={options} className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>{children({ agents: agents.value })}</SidebarMenu>
    </Section>
  )
}
