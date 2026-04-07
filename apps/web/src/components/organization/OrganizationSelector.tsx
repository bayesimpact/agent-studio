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
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { Logo } from "@/components/themes/Logo"
import {
  selectCurrentOrganization,
  selectOrganizationsData,
} from "@/features/organizations/organizations.selectors"
import { buildOrganizationPath } from "@/hooks/use-build-path"

export function OrganizationSelector({
  TriggerButton = "button",
  side = "bottom",
  disabled,
}: {
  disabled?: boolean
  TriggerButton?: React.ElementType
  side?: "bottom" | "right"
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organization = useAppSelector(selectCurrentOrganization)
  const organizations = useAppSelector(selectOrganizationsData)

  const handleOrganizationChange = (organizationId: string) => () => {
    const path = buildOrganizationPath({ organizationId, isStudioInterface: false })
    navigate(path)
  }

  if (!ADS.isFulfilled(organization) || !ADS.isFulfilled(organizations)) return null

  const isButton = TriggerButton === "button"

  const hasMultipleOrganizations = organizations.value.length > 1 && !disabled

  const triggerButton = (
    <TriggerButton
      size="lg"
      className={cn(
        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
        isButton &&
          "w-full rounded-md p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        !hasMultipleOrganizations && "cursor-default hover:bg-transparent",
      )}
      variant="ghost"
    >
      <div className="flex flex-1 gap-2 items-center">
        <div
          className={cn(
            "size-10 contain-content p-1",
            isButton && "flex items-center justify-center",
          )}
        >
          <Logo />
        </div>
        <div className="flex flex-col gap-0.5 leading-none text-left">
          <span className="font-medium text-base">{organization.value.name}</span>
        </div>

        {hasMultipleOrganizations && <ChevronsUpDownIcon className="ml-auto size-4" />}
      </div>
    </TriggerButton>
  )

  if (hasMultipleOrganizations)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>

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
  return triggerButton
}
