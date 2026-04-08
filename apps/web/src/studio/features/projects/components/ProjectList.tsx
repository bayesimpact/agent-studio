import { useTranslation } from "react-i18next"
import { ListHeader } from "@/desk/components/ListHeader"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { Grid, GridContent, GridHeader, GridItem } from "@/studio/components/grid/Grid"
import { ProjectCreator } from "@/studio/features/projects/components/ProjectCreator"
import { ProjectItem, ProjectItem2 } from "./ProjectItem"

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
      <ProjectCreator organization={organization} />

      {projects.map((project) => (
        <ProjectItem key={project.id} organizationId={organization.id} project={project} />
      ))}
    </ListHeader>
  )
}

export function ProjectList2({
  projects,
  organization,
  userName,
}: {
  userName: string
  projects: Project[]
  organization: Organization
}) {
  const { t } = useTranslation()
  return (
    <Grid cols={3} total={projects.length} extraItems={1}>
      <GridHeader title={organization.name} description={t("project:list.title", { userName })} />

      <GridContent>
        {projects.map((project, index) => (
          <ProjectItem2
            index={index}
            key={project.id}
            organizationId={organization.id}
            project={project}
          />
        ))}

        <ProjectCreatorButton organization={organization} index={projects.length} />
      </GridContent>
    </Grid>
  )
}

function ProjectCreatorButton({
  organization,
  index,
}: {
  organization: Organization
  index: number
}) {
  const { t } = useTranslation()
  return (
    <GridItem
      index={index}
      className="bg-muted/35"
      title={t("project:create.title")}
      description={t("project:create.description", { organizationName: organization.name })}
      action={<ProjectCreator organization={organization} />}
    />
  )
}
