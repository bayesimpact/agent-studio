import { DropdownMenuItem, DropdownMenuSeparator } from "@caseai-connect/ui/shad/dropdown-menu"
import { ExternalLinkIcon, LogOutIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthHandler } from "@/common/hooks/use-auth-handler"

export function NavUserMenuItems() {
  return (
    <>
      <HelpCenter />

      <LanguageSelector />

      <DropdownMenuSeparator />

      <LogOutButton />
    </>
  )
}

function HelpCenter() {
  const { t } = useTranslation("user")
  const path = import.meta.env.VITE_HELP_CENTER_URL as string | undefined
  if (!path) return null
  return (
    <DropdownMenuItem onSelect={() => window.open(path, "_blank")}>
      <ExternalLinkIcon />
      {t("helpCenter")}
    </DropdownMenuItem>
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
