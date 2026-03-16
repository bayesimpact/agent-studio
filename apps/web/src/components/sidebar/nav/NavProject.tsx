"use client"

import { useState } from "react"
import type { Project } from "@/features/projects/projects.models"
import { ProjectDeletor } from "../../project/ProjectDeletor"
import { ProjectEditor } from "../../project/ProjectEditor"
import { ProjectItemOptions } from "../../project/ProjectItemOptions"
import { SidebarProjectItem } from "../../project/SidebarProjectItem"
import { AdminAgentList, AppAgentList } from "../list/SidebarAgentList"

type Item = { action: "edit" | "delete"; value: Project }
type Props = {
  organizationId: string
  project: Project
  projects: Project[]
}
export function AdminNavProject({ organizationId, project, projects }: Props) {
  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)
  return (
    <>
      <SidebarProjectItem
        key={project.id}
        project={project}
        projects={projects}
        options={
          <ProjectItemOptions
            onEdit={() => handleItem({ action: "edit", value: project })}
            onDelete={() => handleItem({ action: "delete", value: project })}
          />
        }
        showEmptyProject={true}
      >
        {({ agents }) => (
          <AdminAgentList organizationId={organizationId} agents={agents} project={project} />
        )}
      </SidebarProjectItem>

      <ProjectEditor project={item?.action === "edit" ? item.value : null} onClose={handleClose} />

      <ProjectDeletor
        project={item?.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </>
  )
}

export function AppNavProject({ organizationId, project, projects }: Props) {
  return (
    <SidebarProjectItem key={project.id} project={project} projects={projects}>
      {({ agents }) => (
        <AppAgentList projectId={project.id} organizationId={organizationId} agents={agents} />
      )}
    </SidebarProjectItem>
  )
}
