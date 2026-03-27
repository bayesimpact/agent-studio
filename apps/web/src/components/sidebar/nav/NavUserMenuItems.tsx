import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { LogOutIcon, ShieldBanIcon, ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAbility } from "@/hooks/use-ability"
import { useAuthHandler } from "@/hooks/use-auth-handler"
import { useGetPath } from "@/hooks/use-build-path"
import { RouteNames } from "@/routes/helpers"

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
  const navigate = useNavigate()
  const { t } = useTranslation("actions")
  const { abilities, isAdminInterface } = useAbility()
  const { getPath } = useGetPath()

  const toStudio = !isAdminInterface && abilities.canManageOrganizations

  const handleChange = () => {
    const newLocation = getPath("project", {
      forceInterface: toStudio ? RouteNames.STUDIO : RouteNames.APP,
    })
    navigate(newLocation)
  }

  if (!abilities.canManageProjects) return null
  return (
    <DropdownMenuGroup>
      {isAdminInterface ? (
        <DropdownMenuItem onSelect={handleChange}>
          <ShieldBanIcon />
          {t("exitStudio")}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={handleChange}>
          <ShieldCheckIcon />
          {t("goToStudio")}
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
