/**
 * Formats the date injected into system prompts as YYYY-MM-DD. Built from
 * the local calendar fields rather than `toISOString()` (which would shift
 * the day near midnight in a non-UTC timezone) and without
 * `toLocaleDateString()`, whose output depends on the host locale — an
 * unambiguous, stable format matters here because the model reads it.
 */
export function formatPromptDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
