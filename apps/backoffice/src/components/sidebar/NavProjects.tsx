"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { useAppSelector } from "@/store/hooks"
import { CreateProjectButton } from "./projects/CreateProjectButton"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { ProjectListItem } from "./projects/ProjectListItem"

export function NavProjects({
  projects,
  organizationId,
}: {
  projects: ProjectDto[]
  organizationId: string
}) {
  const currentOrganization = useAppSelector(selectCurrentOrganization(organizationId))
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectDto | null>(null)

  if (!currentOrganization) {
    return null
  }

  const handleEdit = (id: string) => {
    const project = projects.find((p) => p.id === id) || null
    setEditingProject(project)
  }

  const handleDelete = (id: string) => {
    const project = projects.find((p) => p.id === id) || null
    setDeletingProject(project)
  }

  return (
    <Section name="Projects" className="group-data-[collapsible=icon]:hidden">
      {projects.length === 0 ? (
        <CreateProjectButton
          organizationId={currentOrganization.id}
          organizationName={currentOrganization.name}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      ) : (
        <>
          <SidebarMenu>
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                organizationId={currentOrganization.id}
                onEdit={() => handleEdit(project.id)}
                onDelete={() => handleDelete(project.id)}
              />
            ))}
          </SidebarMenu>

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
