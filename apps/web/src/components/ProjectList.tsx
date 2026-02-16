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
import { useBuildPath } from "@/hooks/use-build-path"
import { buildDate } from "@/utils/build-date"
import { ListHeader } from "./layouts/ListHeader"
import { CreateProjectDialogWithTrigger } from "./sidebar/projects/CreateProjectDialog"

export function ProjectList({
  projects,
  organization,
  isAdminInterface,
}: {
  projects: Project[]
  organization: Organization
  isAdminInterface: boolean
}) {
  const { t } = useTranslation("common")
  return (
    <ListHeader title={t("projects")} withInterfaceToggle>
      {projects.map((project) => (
        <ProjectItem key={project.id} organizationId={organization.id} project={project} />
      ))}

      {isAdminInterface && <CreateProjectDialogWithTrigger organization={organization} />}
    </ListHeader>
  )
}

function ProjectItem({ project, organizationId }: { project: Project; organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation("common")
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
        <Button onClick={handleClick}>{t("open")}</Button>
      </ItemActions>
    </Item>
  )
}
