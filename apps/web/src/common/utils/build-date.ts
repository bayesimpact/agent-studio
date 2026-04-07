import type { TimeType } from "@caseai-connect/api-contracts"
import { type FormatOptions, format, formatDistanceToNow } from "date-fns"
import { getLocale } from "./get-locale"

export function buildDate(
  date: TimeType,
  formatStr: string = "dd MMMM yyyy HH:mm",
  formatOptions?: FormatOptions,
) {
  return format(new Date(date), formatStr, { locale: getLocale(), ...formatOptions })
}

export function buildSince(date: TimeType) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: getLocale(),
  })
}
