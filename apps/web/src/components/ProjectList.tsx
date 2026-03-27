import { Button } from "@caseai-connect/ui/shad/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath, useGetPath } from "@/hooks/use-build-path"
import { useRedirectToStudio } from "@/hooks/use-redirect-to-studio"
import { RouteNames } from "@/routes/helpers"
import { buildDate } from "@/utils/build-date"
import { ListHeader } from "./layouts/ListHeader"
import { ProjectCreator } from "./project/ProjectCreator"

export function ProjectList({
  projects,
  organization,
  isAdminInterface,
}: {
  projects: Project[]
  organization: Organization
  isAdminInterface: boolean
}) {
  const { t } = useTranslation()

  useRedirectToStudio({ condition: projects.length === 0, to: "organization" })

  return (
    <ListHeader
      title={t("project:projects")}
      className="min-h-screen"
      disableOrganizationSelector={false}
    >
      {isAdminInterface && <ProjectCreator organization={organization} />}

      {projects.map((project) => (
        <ProjectItem key={project.id} organizationId={organization.id} project={project} />
      ))}

      <InterfaceSwitcher />
    </ListHeader>
  )
}

function InterfaceSwitcher() {
  const navigate = useNavigate()
  const { t } = useTranslation("actions")
  const { isAdminInterface, abilities } = useAbility()
  const { getPath } = useGetPath()

  const toStudio = !isAdminInterface && abilities.canManageOrganizations

  const path = getPath("organization", {
    forceInterface: toStudio ? RouteNames.STUDIO : RouteNames.APP,
  })

  const handleClick = () => navigate(path)

  if (!abilities.canManageOrganizations) return null
  return (
    <Button variant="outline" onClick={handleClick}>
      {t(toStudio ? "goToStudio" : "exitStudio")}
    </Button>
  )
}

function ProjectItem({ project, organizationId }: { project: Project; organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("project", { organizationId, projectId: project.id })
    navigate(path)
  }
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>{project.name}</ItemTitle>
        <ItemDescription>{buildDate(project.updatedAt)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("actions:open")}</Button>
      </ItemActions>
    </Item>
  )
}
