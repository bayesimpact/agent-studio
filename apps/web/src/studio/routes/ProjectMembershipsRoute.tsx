import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { MembersCreator } from "@/components/project-membership/MembersCreator"
import { ProjectMembershipItem } from "@/components/project-membership/ProjectMembershipItem"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { Grid, GridContent, GridHeader, GridItem } from "@/studio/components/grid/Grid"
import type { ProjectMembership } from "@/studio/features/project-memberships/project-memberships.models"
import { selectProjectMemberships } from "@/studio/features/project-memberships/project-memberships.selectors"
import { AsyncRoute } from "../../common/routes/AsyncRoute"
import { useGetStudioPath } from "../hooks/use-studio-build-path"

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
  const { getStudioPath } = useGetStudioPath()
  const handleBack = () => {
    const path = getStudioPath("project")
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
