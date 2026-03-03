"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { useState } from "react"
import { ProjectDeletor } from "../../project/ProjectDeletor"
import { ProjectEditor } from "../../project/ProjectEditor"
import { ProjectItemOptions } from "../../project/ProjectItemOptions"
import { SidebarProjectItem } from "../../project/SidebarProjectItem"
import { AdminAgentList, AppAgentList } from "../list/SidebarAgentList"

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
      <SidebarProjectItem
        key={project.id}
        project={project}
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

export function AppNavProject({
  organizationId,
  project,
}: {
  organizationId: string
  project: ProjectDto
}) {
  return (
    <SidebarProjectItem key={project.id} project={project}>
      {({ agents }) => (
        <AppAgentList projectId={project.id} organizationId={organizationId} agents={agents} />
      )}
    </SidebarProjectItem>
  )
}
