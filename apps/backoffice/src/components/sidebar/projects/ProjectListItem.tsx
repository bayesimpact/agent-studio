"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
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
import { Edit, Folder, MoreHorizontal, Trash2 } from "lucide-react"

interface ProjectListItemProps {
  project: ProjectDto
  onEdit: (project: ProjectDto) => void
  onDelete: (project: ProjectDto) => void
}

export function ProjectListItem({ project, onEdit, onDelete }: ProjectListItemProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenuItem>
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
          <DropdownMenuItem onClick={() => onEdit(project)}>
            <Edit className="text-muted-foreground" />
            <span>Edit Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(project)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="text-muted-foreground" />
            <span>Delete Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
