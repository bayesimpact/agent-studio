import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@caseai-connect/ui/shad/sidebar"
import { cn } from "@caseai-connect/ui/utils"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ProjectCreator } from "./ProjectCreator"

export function SidebarProjectItem({
  project,
  projects,
  children,
  options,
  showEmptyProject = false,
}: {
  project: Project
  projects: Project[]
  children: (args: { agents: Agent[] }) => React.ReactNode
  options?: React.ReactNode
  showEmptyProject?: boolean
}) {
  const { isAdminInterface } = useAbility()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const agents = useAppSelector(selectAgentsData)
  const { isMobile } = useSidebar()
  const { buildPath } = useBuildPath()
  const organization = useAppSelector(selectCurrentOrganization)

  const [openProjectCreator, setOpenProjectCreator] = useState(false)

  if (!ADS.isFulfilled(agents) || !ADS.isFulfilled(organization)) return null
  if (agents.value.length === 0 && !showEmptyProject) return null

  const name = project.name.length < 10 ? `${t("project:project")} - ${project.name}` : project.name

  const handleProjectChange = (projectId: string) => () => {
    const path = buildPath("project", { organizationId: organization.value.id, projectId })
    navigate(path)
  }
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <DropdownMenu>
        <div className="flex gap-4 items-center justify-center mb-4">
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <span className="text-base font-medium">{name}</span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {options && <div className="shrink-0 pl-2">{options}</div>}
        </div>

        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="start"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("project:projects")}
          </DropdownMenuLabel>
          {projects.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={handleProjectChange(p.id)}
              className={cn("gap-2 p-2 justify-between", p.id === project.id && "font-semibold")}
            >
              {p.name} {p.id === project.id && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}

          {isAdminInterface && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenProjectCreator(true)}>
                <PlusIcon />
                <span className="capitalize-first">{t("project:create.button")}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdminInterface && (
        <ProjectCreator
          organization={organization.value}
          modalHandler={{ open: openProjectCreator, setOpen: setOpenProjectCreator }}
        />
      )}

      <SidebarMenu>{children({ agents: agents.value })}</SidebarMenu>
    </SidebarGroup>
  )
}
