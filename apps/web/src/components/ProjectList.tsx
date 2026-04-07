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
import { buildDate } from "@/common/utils/build-date"
import { useBuildDeskPath } from "@/desk/hooks/use-desk-build-path"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { ListHeader } from "./layouts/ListHeader"

export function ProjectList({
  projects,
  organization,
}: {
  projects: Project[]
  organization: Organization
}) {
  const { t } = useTranslation()

  return (
    <ListHeader
      title={t("project:projects")}
      className="min-h-screen"
      disableOrganizationSelector={false}
    >
      {projects.map((project) => (
        <ProjectItem key={project.id} organizationId={organization.id} project={project} />
      ))}
    </ListHeader>
  )
}

function ProjectItem({ project, organizationId }: { project: Project; organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildDeskPath } = useBuildDeskPath()
  const handleClick = () => {
    const path = buildDeskPath("project", { organizationId, projectId: project.id })
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
