export const promptHelpers = {
  now: `Today's date: ${new Date().toLocaleDateString()}`,
  language: (locale: string) =>
    `## Response language:
Always answer in ${locale === "en" ? "English" : locale === "fr" ? "French" : "user's language"}.
      `.trim(),
}
