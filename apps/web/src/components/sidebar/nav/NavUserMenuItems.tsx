import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { ExternalLinkIcon, LogOutIcon, ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useDeskGetPath } from "@/desk/hooks/use-desk-build-path"
import { useAbility } from "@/hooks/use-ability"
import { useAuthHandler } from "@/hooks/use-auth-handler"
import { useGetStudioPath } from "@/studio/hooks/use-studio-build-path"
import { isStudioInterface } from "@/studio/routes/helpers"

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
  const { t } = useTranslation("actions")
  const { abilities } = useAbility()
  const { getStudioPath } = useGetStudioPath()
  const { getDeskPath } = useDeskGetPath()

  const isStudio = isStudioInterface()

  if (!abilities.canAccessStudio) return null
  return (
    <DropdownMenuGroup>
      {isStudio ? (
        <DropdownMenuItem asChild>
          <a target="_blank" rel="noopener noreferrer" href={getDeskPath("organization")}>
            <ExternalLinkIcon />
            {t("goToApp")}
          </a>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem asChild>
          <a target="_blank" rel="noopener noreferrer" href={getStudioPath("organization")}>
            <ShieldCheckIcon />
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
