import { DropdownMenuItem, DropdownMenuSeparator } from "@caseai-connect/ui/shad/dropdown-menu"
import { LogOutIcon, PaletteIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthHandler } from "@/hooks/use-auth-handler"
import { ThemeSwitcher } from "../../themes/ThemeSwitcher"

export function NavUserMenuItems() {
  return (
    <>
      <ChangeLanguage />

      <DropdownMenuSeparator />

      <DropdownMenuItem>
        <PaletteIcon className="mr-2 size-4 text-primary" /> <ThemeSwitcher />
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <LogOutButton />
    </>
  )
}

function LogOutButton() {
  const { t } = useTranslation("user", { keyPrefix: "menu" })
  const { handleLogOut } = useAuthHandler()
  return (
    <DropdownMenuItem onSelect={handleLogOut}>
      <LogOutIcon />
      {t("logout")}
    </DropdownMenuItem>
  )
}

function ChangeLanguage() {
  const { i18n } = useTranslation("user", { keyPrefix: "menu" })
  if (i18n.language === "en") {
    return (
      <DropdownMenuItem onSelect={() => i18n.changeLanguage("fr")}>
        <span>🇫🇷</span>
        <span className="ml-0.5">Choisir le Français</span>
      </DropdownMenuItem>
    )
  } else {
    return (
      <DropdownMenuItem onSelect={() => i18n.changeLanguage("en")}>
        <span>🇺🇸</span>
        <span className="ml-0.5">Switch to English</span>
      </DropdownMenuItem>
    )
  }
}
