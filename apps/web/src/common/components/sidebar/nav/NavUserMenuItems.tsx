import { DropdownMenuItem, DropdownMenuSeparator } from "@caseai-connect/ui/shad/dropdown-menu"
import { LogOutIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthHandler } from "@/common/hooks/use-auth-handler"

export function NavUserMenuItems() {
  return (
    <>
      <LanguageSelector />

      <DropdownMenuSeparator />

      <LogOutButton />
    </>
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
