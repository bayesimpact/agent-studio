import { AgentLocale } from "@caseai-connect/api-contracts"
import { enUS, fr, type Locale } from "date-fns/locale"

export const getLocale = (): Locale => {
  const userLang = (localStorage.getItem("i18nextLng") as AgentLocale | null) || AgentLocale.EN
  const locale = userLang === AgentLocale.FR ? fr : enUS
  return locale
}
