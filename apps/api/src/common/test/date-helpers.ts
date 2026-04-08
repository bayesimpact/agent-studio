const dayDurationMs = 24 * 60 * 60 * 1000
const hourDurationMs = 60 * 60 * 1000
const minuteDurationMs = 60 * 1000

export const days = (dayCount: number) => ({
  after: (date: Date) => new Date(date.getTime() + dayCount * dayDurationMs),
  later: (date: Date) => new Date(date.getTime() + dayCount * dayDurationMs),
  before: (date: Date) => new Date(date.getTime() - dayCount * dayDurationMs),
  agoFrom: (date: Date) => new Date(date.getTime() - dayCount * dayDurationMs),
})

export const hours = (hourCount: number) => ({
  after: (date: Date) => new Date(date.getTime() + hourCount * hourDurationMs),
  later: (date: Date) => new Date(date.getTime() + hourCount * hourDurationMs),
  before: (date: Date) => new Date(date.getTime() - hourCount * hourDurationMs),
  agoFrom: (date: Date) => new Date(date.getTime() - hourCount * hourDurationMs),
})

export const minutes = (minuteCount: number) => ({
  after: (date: Date) => new Date(date.getTime() + minuteCount * minuteDurationMs),
  later: (date: Date) => new Date(date.getTime() + minuteCount * minuteDurationMs),
  before: (date: Date) => new Date(date.getTime() - minuteCount * minuteDurationMs),
  agoFrom: (date: Date) => new Date(date.getTime() - minuteCount * minuteDurationMs),
})

export const endOfUtcDay = (date: Date) => new Date(days(1).later(date).getTime() - 1)
