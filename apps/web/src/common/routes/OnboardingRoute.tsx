import { Button } from "@caseai-connect/ui/shad/button"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Grid, GridContent, GridHeader, GridItem } from "@/common/components/grid/Grid"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/common/features/organizations/organizations.selectors"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { OrganizationCreator } from "@/components/organization/OrganizationCreator"
import { buildDeskPath } from "@/desk/routes/helpers"
import { useAbility } from "@/hooks/use-ability"
import { buildStudioPath } from "@/studio/routes/helpers"
import { selectMe } from "../features/me/me.selectors"
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
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { abilities } = useAbility()

  const handleGoToStudio = () => {
    const path = buildStudioPath(`/o/${organization.id}/`)
    navigate(path)
  }

  const handleGoToApp = () => {
    const path = buildDeskPath(`/o/${organization.id}/`)
    navigate(path)
  }

  const canAccessStudio = abilities.canAccessStudio
  return (
    <GridItem
      index={index}
      badge={t("organization:organization")}
      title={organization.name}
      description={""}
      action={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={canAccessStudio ? "outline" : "default"} onClick={handleGoToApp}>
            {t("actions:goToApp")}
          </Button>
          {canAccessStudio && <Button onClick={handleGoToStudio}>{t("actions:goToStudio")}</Button>}
        </div>
      }
    />
  )
}
