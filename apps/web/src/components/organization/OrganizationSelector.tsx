import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { cn } from "@caseai-connect/ui/utils"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  selectCurrentOrganization,
  selectOrganizationsData,
} from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { RouteNames } from "@/common/routes/helpers"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { Logo } from "@/components/themes/Logo"
import { buildOrganizationPath, useGetPath } from "@/hooks/use-build-path"
import { isStudioInterface } from "@/studio/routes/helpers"

export function OrganizationSelector({
  side = "bottom",
  disabled,
}: {
  disabled?: boolean
  side?: "bottom" | "right"
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organization = useAppSelector(selectCurrentOrganization)
  const projectId = useAppSelector(selectCurrentProjectId)
  const organizations = useAppSelector(selectOrganizationsData)
  const { getPath } = useGetPath()

  const handleOrganizationChange = (organizationId: string) => () => {
    const path = buildOrganizationPath({ organizationId })
    navigate(path)
  }

  if (!ADS.isFulfilled(organization) || !ADS.isFulfilled(organizations)) return null

  const hasMultipleOrganizations = organizations.value.length > 1 && !disabled

  const handleBack = () => {
    navigate(projectId ? getPath("organization") : RouteNames.HOME)
  }

  if (hasMultipleOrganizations)
    return (
      <DropdownMenu>
        <MainButton onClick={handleBack} organizationName={organization.value.name}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg">
              <ChevronsUpDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </MainButton>

        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="start"
          side={side}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("organization:organizations")}
          </DropdownMenuLabel>
          {organizations.value.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={handleOrganizationChange(org.id)}
              className={cn(
                "gap-2 p-2 justify-between",
                org.id === organization.value.id && "font-semibold",
              )}
            >
              {org.name} {org.id === organization.value.id && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )

  // Single organization, no dropdown needed
  return <MainButton onClick={handleBack} organizationName={organization.value.name} />
}

export function MainButton({
  children,
  onClick,
  organizationName,
}: {
  children?: React.ReactNode
  onClick: () => void
  organizationName: string
}) {
  return (
    <div className="flex flex-1 gap-2 items-center">
      <button type="button" onClick={onClick} className="p-1 size-10 contain-content">
        <Logo />
      </button>

      <button type="button" onClick={onClick} className="flex-1">
        <div className="flex flex-col gap-0 leading-none text-left">
          <span className="font-medium text-lg">{organizationName}</span>
          {isStudioInterface() && <span className="text-primary capitalize-first">Studio</span>}
        </div>
      </button>

      {children}
    </div>
  )
}
