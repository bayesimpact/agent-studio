import type { DateRange } from "react-day-picker"

function startOfLocalDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

/**
 * Inclusive rolling window of calendar days ending on `referenceDate` (local).
 * Example: dayCount 7 → today and the six previous days.
 */
export function getInclusiveRollingDayRange(
  dayCount: number,
  referenceDate: Date = new Date(),
): DateRange {
  const to = startOfLocalDay(referenceDate)
  const from = startOfLocalDay(referenceDate)
  from.setDate(from.getDate() - (dayCount - 1))
  return { from, to }
}

export function getLast7DaysRange(referenceDate?: Date): DateRange {
  return getInclusiveRollingDayRange(7, referenceDate)
}

export function getLast30DaysRange(referenceDate?: Date): DateRange {
  return getInclusiveRollingDayRange(30, referenceDate)
}
