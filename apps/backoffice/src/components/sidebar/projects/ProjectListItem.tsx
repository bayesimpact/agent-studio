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
import { Link } from "react-router-dom"
import { buildProjectPath } from "@/routes/helpers"

interface ProjectListItemProps {
  project: ProjectDto
  organizationId: string
  onEdit: (project: ProjectDto) => void
  onDelete: (project: ProjectDto) => void
  isSelected: boolean
}

export function ProjectListItem({
  project,
  organizationId,
  onEdit,
  onDelete,
  isSelected,
}: ProjectListItemProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className={isSelected ? "bg-muted" : ""} asChild>
        <Link
          to={buildProjectPath({
            organizationId,
            projectId: project.id,
          })}
        >
          <Folder />
          <span>{project.name}</span>
        </Link>
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
