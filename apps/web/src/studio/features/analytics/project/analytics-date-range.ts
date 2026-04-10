import type { DateRange } from "react-day-picker"

/**
 * Converts an inclusive local calendar range to API `startAt` / `endAt` (ms),
 * matching local midnight → end-of-day for the selected dates.
 */
export function dateRangeToAnalyticsQueryBounds(
  range: DateRange | undefined,
): { startAt: number; endAt: number } | null {
  if (!range?.from || !range.to) {
    return null
  }
  const from = range.from
  const to = range.to
  const startAt = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const endAt = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime()
  return { startAt, endAt }
}
