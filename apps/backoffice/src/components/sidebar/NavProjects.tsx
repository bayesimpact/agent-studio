"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { Edit, Folder, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CreateProjectForm } from "@/components/CreateProjectForm"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { deleteProject, listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const dispatch = useAppDispatch()
  const organizations = useAppSelector(selectOrganizations)
  const projects = useAppSelector(selectProjects)
  const projectsStatus = useAppSelector(selectProjectsStatus)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectDto | null>(null)

  // Get the first organization (current organization)
  const currentOrganization = organizations.length > 0 ? organizations[0] : null

  // Load projects when organization is available or changes
  useEffect(() => {
    if (currentOrganization) {
      dispatch(listProjects(currentOrganization.id))
    }
  }, [currentOrganization?.id, dispatch, currentOrganization])

  const projectList = projects?.projects || []

  if (!currentOrganization) {
    return null
  }

  return (
    <Section name="Projects" className="group-data-[collapsible=icon]:hidden">
      {projectList.length === 0 ? (
        <SidebarMenuItem>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <SidebarMenuButton tooltip="Create Project">
                <Plus />
                <span>Create Project</span>
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Create a new project for {currentOrganization.name}
                </DialogDescription>
              </DialogHeader>
              <CreateProjectForm
                organizationId={currentOrganization.id}
                onSuccess={() => {
                  setIsCreateDialogOpen(false)
                  dispatch(listProjects(currentOrganization.id))
                }}
              />
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      ) : (
        <>
          {projectList.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild>
                <a href={`/projects/${project.id}`}>
                  <Folder />
                  <span>{project.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onClick={() => setEditingProject(project)}>
                    <Edit className="text-muted-foreground" />
                    <span>Edit Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingProject(project)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton tooltip="Create Project">
                  <Plus />
                  <span>Create Project</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>
                    Create a new project for {currentOrganization.name}
                  </DialogDescription>
                </DialogHeader>
                <CreateProjectForm
                  organizationId={currentOrganization.id}
                  onSuccess={() => {
                    setIsCreateDialogOpen(false)
                    dispatch(listProjects(currentOrganization.id))
                  }}
                />
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </>
      )}

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update the project name</DialogDescription>
            </DialogHeader>
            <CreateProjectForm
              organizationId={currentOrganization.id}
              project={editingProject}
              onSuccess={() => {
                setEditingProject(null)
                dispatch(listProjects(currentOrganization.id))
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Project Confirmation Dialog */}
      {deletingProject && (
        <Dialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingProject.name}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeletingProject(null)}
                disabled={projectsStatus === "loading"}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await dispatch(deleteProject(deletingProject.id)).unwrap()
                    toast.success("Project deleted successfully")
                    setDeletingProject(null)
                    dispatch(listProjects(currentOrganization.id))
                  } catch (err) {
                    const errorMessage =
                      (err as { message?: string })?.message || "Failed to delete project"
                    toast.error(errorMessage)
                  }
                }}
                disabled={projectsStatus === "loading"}
              >
                {projectsStatus === "loading" ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Section>
  )
}
