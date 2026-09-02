import { formatPromptDate } from "./format-prompt-date"

describe("formatPromptDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatPromptDate(new Date(2026, 8, 2))).toBe("2026-09-02")
  })

  it("zero-pads single-digit months and days", () => {
    expect(formatPromptDate(new Date(2026, 0, 5))).toBe("2026-01-05")
  })

  it("reports the local calendar day, not the UTC one", () => {
    // 23:30 local on the 2nd is already the 3rd in UTC east of Greenwich;
    // the prompt must state the day the user is living in.
    const lateEvening = new Date(2026, 8, 2, 23, 30)
    expect(formatPromptDate(lateEvening)).toBe("2026-09-02")
  })

  it("defaults to today", () => {
    expect(formatPromptDate()).toBe(formatPromptDate(new Date()))
  })
})
