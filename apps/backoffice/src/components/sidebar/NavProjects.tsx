"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { useState } from "react"
import { CreateProjectButton } from "./projects/CreateProjectButton"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { useProjectsData } from "./projects/hooks/useProjectsData"
import { ProjectListItem } from "./projects/ProjectListItem"

export function NavProjects() {
  const { currentOrganization, projectList } = useProjectsData()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectDto | null>(null)

  if (!currentOrganization) {
    return null
  }

  return (
    <Section name="Projects" className="group-data-[collapsible=icon]:hidden">
      {projectList.length === 0 ? (
        <CreateProjectButton
          organizationId={currentOrganization.id}
          organizationName={currentOrganization.name}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      ) : (
        <>
          {projectList.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          ))}
          <CreateProjectButton
            organizationId={currentOrganization.id}
            organizationName={currentOrganization.name}
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        </>
      )}

      <EditProjectDialog
        project={editingProject}
        organizationId={currentOrganization.id}
        onClose={() => setEditingProject(null)}
      />

      <DeleteProjectDialog
        project={deletingProject}
        organizationId={currentOrganization.id}
        onClose={() => setDeletingProject(null)}
      />
    </Section>
  )
}
