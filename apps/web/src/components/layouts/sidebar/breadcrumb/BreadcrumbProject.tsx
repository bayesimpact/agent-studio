import { BreadcrumbItem, BreadcrumbLink } from "@caseai-connect/ui/shad/breadcrumb"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { cn } from "@caseai-connect/ui/utils"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Link } from "react-router-dom"
import {
  selectCurrentProjectData,
  selectProjectsData,
} from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

export function BreadcrumbProject({ organizationId }: { organizationId: string }) {
  const projects = useAppSelector(selectProjectsData)
  const project = useAppSelector(selectCurrentProjectData)
  const { buildPath } = useBuildPath()
  if (!ADS.isFulfilled(projects) || !ADS.isFulfilled(project)) return null

  const currentProjectPath = buildPath("project", { organizationId, projectId: project.value.id })
  const handleClick = (projectId: string) => () => {
    const path = buildPath("project", { organizationId, projectId })
    window.location.replace(path)
  }
  if (projects.value.length === 1)
    return (
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to={currentProjectPath}>{project.value.name}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {project.value.name}
          <ChevronDownIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {projects.value.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className={cn("justify-between", p.id === project.value.id && "font-semibold")}
              onClick={handleClick(p.id)}
            >
              {p.name} {p.id === project.value.id && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
