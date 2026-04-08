import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { ExternalLinkIcon, LogOutIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { useAuthHandler } from "@/common/hooks/use-auth-handler"
import { useAppSelector } from "@/common/store/hooks"
import { buildDeskPath } from "@/desk/routes/helpers"
import { buildStudioPath, isStudioInterface } from "@/studio/routes/helpers"

export function NavUserMenuItems() {
  return (
    <>
      <InterfaceToggle />

      <LanguageSelector />

      <DropdownMenuSeparator />

      <LogOutButton />
    </>
  )
}

function InterfaceToggle() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const { t } = useTranslation("actions")
  const { abilities } = useAbility()

  const isStudio = isStudioInterface()

  if (!abilities.canAccessStudio || !organizationId) return null
  return (
    <DropdownMenuGroup>
      {isStudio ? (
        <DropdownMenuItem asChild>
          <a target="_blank" rel="noopener noreferrer" href={buildDeskPath(`/o/${organizationId}`)}>
            <ExternalLinkIcon />
            {t("goToApp")}
          </a>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem asChild>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={buildStudioPath(`/o/${organizationId}`)}
          >
            <ExternalLinkIcon />
            {t("goToStudio")}
          </a>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </DropdownMenuGroup>
  )
}

function LogOutButton() {
  const { t } = useTranslation("user")
  const { handleLogOut } = useAuthHandler()
  return (
    <DropdownMenuItem onSelect={handleLogOut}>
      <LogOutIcon />
      {t("logout")}
    </DropdownMenuItem>
  )
}

function LanguageSelector() {
  const { i18n } = useTranslation()
  if (i18n.language === "fr") {
    return (
      <DropdownMenuItem onSelect={() => i18n.changeLanguage("en")}>
        <span>🇺🇸</span>
        <span className="ml-0.5">Switch to English</span>
      </DropdownMenuItem>
    )
  } else {
    return (
      <DropdownMenuItem onSelect={() => i18n.changeLanguage("fr")}>
        <span>🇫🇷</span>
        <span className="ml-0.5">Choisir le Français</span>
      </DropdownMenuItem>
    )
  }
}
