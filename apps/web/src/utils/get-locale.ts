import { ChatBotLocale } from "@caseai-connect/api-contracts"
import { enUS, fr, type Locale } from "date-fns/locale"

export const getLocale = (): Locale => {
  const userLang = (localStorage.getItem("i18nextLng") as ChatBotLocale | null) || ChatBotLocale.EN
  const locale = userLang === ChatBotLocale.FR ? fr : enUS
  return locale
}
