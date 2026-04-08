import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { cn } from "@caseai-connect/ui/utils"
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Organization } from "@/common/features/organizations/organizations.models"
import {
  selectCurrentProjectData,
  selectProjectsData,
} from "@/common/features/projects/projects.selectors"
import { useBuildPath } from "@/common/hooks/use-build-path"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { ProjectCreator } from "@/studio/features/projects/components/ProjectCreator"
import { isStudioInterface as isStudio } from "@/studio/routes/helpers"

export function BreadcrumbProject({ organization }: { organization: Organization }) {
  const { t } = useTranslation()
  const organizationId = organization.id
  const isStudioInterface = isStudio()
  const projects = useAppSelector(selectProjectsData)
  const project = useAppSelector(selectCurrentProjectData)
  const { buildPath } = useBuildPath()
  const [openProjectCreator, setOpenProjectCreator] = useState(false)

  if (!ADS.isFulfilled(projects) || !ADS.isFulfilled(project)) return null

  const handleClick = (projectId: string) => () => {
    const path = buildPath("project", { organizationId, projectId })
    window.location.replace(path)
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <span>{t("project:project", { colon: true })}</span>
            <span className="font-bold">{project.value.name}</span>

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

            {isStudioInterface && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenProjectCreator(true)}>
                  <PlusIcon />
                  <span className="capitalize-first">{t("project:create.button")}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {isStudioInterface && (
        <ProjectCreator
          organization={organization}
          modalHandler={{ open: openProjectCreator, setOpen: setOpenProjectCreator }}
        />
      )}
    </>
  )
}
