import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { BadgeCheckIcon, BellIcon, CreditCardIcon, LogOutIcon, SparklesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthHandler } from "@/hooks/use-auth-handler"

export function NavUserMenuItems() {
  const { t } = useTranslation("user", { keyPrefix: "menu" })
  const { handleLogOut } = useAuthHandler()
  return (
    <>
      <DropdownMenuGroup>
        <ChangeLanguage />
        <DropdownMenuItem>
          <SparklesIcon />
          {t("upgrade")}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <BadgeCheckIcon />
          {t("account")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCardIcon />
          {t("billing")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BellIcon />
          {t("notifications")}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={handleLogOut}>
        <LogOutIcon />
        {t("logout")}
      </DropdownMenuItem>
    </>
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
