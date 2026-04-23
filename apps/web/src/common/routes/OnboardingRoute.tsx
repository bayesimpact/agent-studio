import { Button } from "@caseai-connect/ui/shad/button"
import { useSidebar } from "@caseai-connect/ui/shad/sidebar"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import { OrganizationCreator } from "@/common/components/organization/OrganizationCreator"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/common/features/organizations/organizations.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { DeskRouteNames } from "@/desk/routes/helpers"
import { EvalRouteNames } from "@/eval/routes/helpers"
import { ProjectCreatorButton } from "@/studio/features/projects/components/ProjectCreator"
import { StudioRouteNames } from "@/studio/routes/helpers"
import { Wrap } from "../components/layouts/Wrap"
import type { User } from "../features/me/me.models"
import { selectMe } from "../features/me/me.selectors"
import type { Project } from "../features/projects/projects.models"
import { useAbility } from "../hooks/use-ability"
import { useBuildPath } from "../hooks/use-build-path"
import { useFeatureFlags } from "../hooks/use-feature-flags"
import { buildSince } from "../utils/build-date"
import { AsyncRoute } from "./AsyncRoute"

export function OnboardingRoute() {
  const user = useAppSelector(selectMe)
  const organizations = useAppSelector(selectOrganizationsData)
  return (
    <AsyncRoute data={[user, organizations]}>
      {([userValue, organizationsValue]) => (
        <WithData user={userValue} organizations={organizationsValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({ user, organizations }: { user: User; organizations: Organization[] }) {
  const orgsCount = organizations.length
  if (orgsCount === 0) return <OrganizationCreator />

  return (
    <SidebarLayout user={{ name: user.name, email: user.email }}>
      <SidebarContent organizations={organizations} user={user} orgsCount={orgsCount} />
    </SidebarLayout>
  )
}

function SidebarContent({
  organizations,
  user,
  orgsCount,
}: {
  organizations: Organization[]
  user: User
  orgsCount: number
}) {
  const { t } = useTranslation()
  const { setOpen } = useSidebar()
  useEffect(() => {
    setOpen(false)
  }, [setOpen])
  return (
    <Wrap>
      <Grid cols={1} total={orgsCount}>
        <GridHeader
          title={t("organization:list:title", { name: user.name })}
          description={t("organization:list:description")}
        />
        <GridContent>
          {organizations.map((organization, index) => (
            <OrganizationItem key={organization.id} organization={organization} index={index} />
          ))}
        </GridContent>
      </Grid>
    </Wrap>
  )
}

function OrganizationItem({ organization, index }: { organization: Organization; index: number }) {
  const { t } = useTranslation()
  const { abilities } = useAbility()
  const canCreateProject = abilities.canCreateProject({
    organizationId: organization.id,
  })

  const extraItems = canCreateProject ? 1 : 0
  return (
    <GridItem
      className="bg-gray-50"
      index={index}
      title={organization.name}
      description={t("organization:organization")}
      action={
        <Grid cols={2} total={organization.projects.length} extraItems={extraItems}>
          <GridContent className="bg-white rounded-2xl border">
            {organization.projects.map((project, index) => (
              <GridItem
                badge={t("project:project")}
                key={project.id}
                index={index}
                title={project.name}
                description={buildSince(project.createdAt)}
                action={
                  <div className="flex items-center gap-2 flex-wrap">
                    <NavAppButton organizationId={organization.id} projectId={project.id} />

                    <NavStudioButton organizationId={organization.id} projectId={project.id} />

                    <NavEvalButton organizationId={organization.id} project={project} />
                  </div>
                }
              />
            ))}

            {canCreateProject && (
              <ProjectCreatorButton
                index={organization.projects.length}
                organization={organization}
              />
            )}
          </GridContent>
        </Grid>
      }
    />
  )
}

function NavAppButton({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { buildPath } = useBuildPath()

  const handleClick = () => {
    const path = buildPath("project", {
      organizationId,
      projectId,
      forceInterface: DeskRouteNames.APP,
    })
    // NOTE: do not use navigate from react-router
    window.location.assign(path)
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      {t("actions:goToApp")}
    </Button>
  )
}

function NavStudioButton({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { abilities } = useAbility()
  const canAccessStudio = abilities.canAccessStudio({ projectId })
  const { buildPath } = useBuildPath()

  const handleClick = () => {
    const path = buildPath("project", {
      organizationId,
      projectId,
      forceInterface: StudioRouteNames.APP,
    })
    // NOTE: do not use navigate from react-router
    window.location.assign(path)
  }

  if (!canAccessStudio) return null
  return (
    <Button variant="outline" onClick={handleClick}>
      {t("actions:goToStudio")}
    </Button>
  )
}

function NavEvalButton({ organizationId, project }: { organizationId: string; project: Project }) {
  const { t } = useTranslation()
  const { hasFeature } = useFeatureFlags(project)
  const { buildPath } = useBuildPath()

  const handleClick = () => {
    const path = buildPath("project", {
      organizationId,
      projectId: project.id,
      forceInterface: EvalRouteNames.APP,
    })
    // NOTE: do not use navigate from react-router
    window.location.assign(path)
  }

  if (!hasFeature("evaluation")) return null
  return (
    <Button variant={"outline"} onClick={handleClick}>
      {t("actions:goToEval")}
    </Button>
  )
}
