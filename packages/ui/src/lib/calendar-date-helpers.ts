/** Start of the given calendar day in local time. */
export function startOfLocalDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

/** True when `date` is strictly after today’s calendar day (local). */
export function isCalendarDayAfterToday(date: Date): boolean {
  return startOfLocalDay(date) > startOfLocalDay(new Date())
}
