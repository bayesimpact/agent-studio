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
import { ProjectCreator } from "@/components/project/ProjectCreator"
import type { Organization } from "@/features/organizations/organizations.models"
import {
  selectCurrentProjectData,
  selectProjectsData,
} from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

export function BreadcrumbProject({ organization }: { organization: Organization }) {
  const { t } = useTranslation()
  const organizationId = organization.id
  const { isAdminInterface } = useAbility()
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

            {isAdminInterface && (
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
      {isAdminInterface && (
        <ProjectCreator
          organization={organization}
          modalHandler={{ open: openProjectCreator, setOpen: setOpenProjectCreator }}
        />
      )}
    </>
  )
}

// ;<div className="flex items-center gap-2">
//   <DropdownMenu>
//     <DropdownMenuTrigger asChild>
//       <SidebarMenuButton size="lg">
//         <div className="flex flex-col flex-1">
//           <span className="text-base font-medium leading-4">{project.name}</span>
//           <span className="text-xs text-muted-foreground">Workspace</span>
//         </div>

//         <ChevronsUpDownIcon className="shrink-0 size-4" />
//       </SidebarMenuButton>
//     </DropdownMenuTrigger>

//     <DropdownMenuContent
//       className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
//       align="start"
//       side={isMobile ? "bottom" : "right"}
//       sideOffset={4}
//     >
//       <DropdownMenuLabel className="text-xs text-muted-foreground">
//         {t("project:projects")}
//       </DropdownMenuLabel>

//       {projects.map((p) => (
//         <DropdownMenuItem
//           key={p.id}
//           onClick={handleProjectChange(p.id)}
//           className={cn("gap-2 p-2 justify-between", p.id === project.id && "font-semibold")}
//         >
//           {p.name} {p.id === project.id && <CheckIcon className="size-4" />}
//         </DropdownMenuItem>
//       ))}

//       {isAdminInterface && (
//         <>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem onClick={() => setOpenProjectCreator(true)}>
//             <PlusIcon />
//             <span className="capitalize-first">{t("project:create.button")}</span>
//           </DropdownMenuItem>
//         </>
//       )}
//     </DropdownMenuContent>
//   </DropdownMenu>

//   {isAdminInterface && (
//     <ProjectCreator
//       organization={organization.value}
//       modalHandler={{ open: openProjectCreator, setOpen: setOpenProjectCreator }}
//     />
//   )}
// </div>
