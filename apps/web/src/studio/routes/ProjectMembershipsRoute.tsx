import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useGetPath } from "@/common/hooks/use-build-path"
import { useAppSelector } from "@/common/store/hooks"
import { MembersCreator } from "@/studio/features/project-memberships/components/MembersCreator"
import { ProjectMembershipItem } from "@/studio/features/project-memberships/components/ProjectMembershipItem"
import type { ProjectMembership } from "@/studio/features/project-memberships/project-memberships.models"
import { selectProjectMemberships } from "@/studio/features/project-memberships/project-memberships.selectors"
import { AsyncRoute } from "../../common/routes/AsyncRoute"

export function ProjectMembershipsRoute() {
  const project = useAppSelector(selectCurrentProjectData)
  const memberships = useAppSelector(selectProjectMemberships)

  return (
    <AsyncRoute data={[memberships, project]}>
      {([membershipsValue, projectValue]) => (
        <WithData memberships={membershipsValue} project={projectValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  memberships,
  project,
}: {
  memberships: ProjectMembership[]
  project: Project
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getPath } = useGetPath()
  const handleBack = () => {
    const path = getPath("project")
    navigate(path)
  }
  const cols = memberships.length === 0 ? 0 : 3
  const total = memberships.length
  return (
    <Grid cols={cols} total={total} extraItems={1}>
      <GridHeader
        onBack={handleBack}
        title={t("projectMembership:list.title", { projectName: project.name })}
        description={t("projectMembership:list.description")}
      />

      <GridContent>
        {memberships.map((membership, index) => (
          <ProjectMembershipItem index={index} key={membership.id} membership={membership} />
        ))}

        <GridItem
          index={total}
          title={t("projectMembership:create.title")}
          description={t("projectMembership:create.description")}
          action={<MembersCreator />}
          className="bg-muted/35"
        />
      </GridContent>
    </Grid>
  )
}
