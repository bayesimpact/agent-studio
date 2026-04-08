import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { OrganizationCreator } from "@/components/organization/OrganizationCreator"
import { Logo } from "@/components/themes/Logo"
import { buildDeskPath } from "@/desk/routes/helpers"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { useAbility } from "@/hooks/use-ability"
import { buildStudioPath } from "@/studio/routes/helpers"
import { FullPageCenterLayout } from "../components/layouts/FullPageCenterLayout"
import { LoadingRoute } from "./LoadingRoute"

export function OnboardingRoute() {
  const { t } = useTranslation()
  const organizations = useAppSelector(selectOrganizationsData)

  if (ADS.isFulfilled(organizations)) {
    if (organizations.value.length === 0) return <OrganizationCreator />

    return (
      <FullPageCenterLayout className="min-h-screen">
        <div className="flex flex-col gap-4 min-w-96 max-w-2/3 2xl:max-w-1/2">
          <div className="mb-2 border-b-4 pb-4 border-muted flex items-center gap-4">
            <div className="size-10 contain-content p-1">
              <Logo />
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight capitalize-first">
              {t("actions:selectOrganization")}
            </h4>
          </div>

          {organizations.value.map((organization) => (
            <OrganizationItem key={organization.id} organization={organization} />
          ))}
        </div>
      </FullPageCenterLayout>
    )
  }

  return <LoadingRoute />
}

function OrganizationItem({ organization }: { organization: Organization }) {
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
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle className="text-lg mb-4 font-semibold w-full flex items-center justify-center">
          {organization.name}
        </ItemTitle>
        <ItemActions className="flex-wrap justify-between">
          <Button
            variant={canAccessStudio ? "outline" : "default"}
            className={canAccessStudio ? "" : "w-full"}
            onClick={handleGoToApp}
          >
            {t("actions:goToApp")}
          </Button>

          {canAccessStudio && <Button onClick={handleGoToStudio}>{t("actions:goToStudio")}</Button>}
        </ItemActions>
      </ItemContent>
    </Item>
  )
}
