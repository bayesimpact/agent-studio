import { Button } from "@caseai-connect/ui/shad/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import { OrganizationCreator } from "@/common/components/organization/OrganizationCreator"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/common/features/organizations/organizations.selectors"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { DeskRouteNames } from "@/desk/routes/helpers"
import { EvalRouteNames } from "@/eval/routes/helpers"
import { StudioRouteNames } from "@/studio/routes/helpers"
import { selectCanAccessStudioForOrganizationId, selectMe } from "../features/me/me.selectors"
import { useAbility } from "../hooks/use-ability"
import { buildOrganizationPath, useBuildPath } from "../hooks/use-build-path"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const { t } = useTranslation()
  const user = useAppSelector(selectMe)
  const organizations = useAppSelector(selectOrganizationsData)

  if (ADS.isFulfilled(organizations) && ADS.isFulfilled(user)) {
    const orgsCount = organizations.value.length
    if (orgsCount === 0) return <OrganizationCreator />

    const cols = orgsCount === 1 ? 1 : orgsCount === 2 ? 2 : 3
    return (
      <SidebarLayout user={{ name: user.value.name, email: user.value.email }}>
        <div className="mx-10 2xl:mx-30 my-10 border relative rounded-2xl overflow-hidden">
          <Grid cols={cols} total={orgsCount}>
            <GridHeader
              title={t("organization:list:title", { name: user.value.name })}
              description={t("organization:list:description")}
            />
            <GridContent>
              {organizations.value.map((organization, index) => (
                <OrganizationItem key={organization.id} organization={organization} index={index} />
              ))}
            </GridContent>
          </Grid>
        </div>
      </SidebarLayout>
    )
  }

  return <LoadingRoute />
}

function OrganizationItem({ organization, index }: { organization: Organization; index: number }) {
  const { t } = useTranslation()

  return (
    <GridItem
      index={index}
      badge={t("organization:organization")}
      title={organization.name}
      description={""}
      action={
        <div className="flex items-center gap-2 flex-wrap">
          <NavAppButton organizationId={organization.id} />

          <NavStudioButton organizationId={organization.id} />

          <NavEvalButton organizationId={organization.id} />
        </div>
      }
    />
  )
}

function NavAppButton({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildPath } = useBuildPath()

  const handleClick = () => {
    const path = buildPath("organization", {
      organizationId,
      forceInterface: DeskRouteNames.APP,
    })
    navigate(path)
  }
  return (
    <Button variant="outline" onClick={handleClick}>
      {t("actions:goToApp")}
    </Button>
  )
}

function NavStudioButton({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const canAccessStudio = useAppSelector(selectCanAccessStudioForOrganizationId(organizationId))
  const { buildPath } = useBuildPath()

  const handleClick = () => {
    const path = buildPath("organization", {
      organizationId,
      forceInterface: StudioRouteNames.STUDIO,
    })
    navigate(path)
  }
  if (!canAccessStudio) return null
  return (
    <Button variant="outline" onClick={handleClick}>
      {t("actions:goToStudio")}
    </Button>
  )
}

function NavEvalButton({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isPremiumMember } = useAbility()
  const handleClick = () => {
    const path = buildOrganizationPath({ organizationId, forceInterface: EvalRouteNames.APP })
    navigate(path)
  }
  if (!isPremiumMember) return null
  return (
    <Button variant={"outline"} onClick={handleClick}>
      {t("actions:goToEval")}
    </Button>
  )
}
