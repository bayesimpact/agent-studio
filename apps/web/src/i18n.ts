import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { colonHandlerPostProcessor } from "./locales/post-processors"

/**
 * Dynamically loads all locale files from features and root locales directory
 * Each feature can have .en.json and .fr.json locale files that are automatically discovered
 */
function loadLocaleResources() {
  // Load all locale files using Vite's import.meta.glob
  // This automatically discovers all locale files without manual imports
  const featureLocales = import.meta.glob("./features/**/locales/*.{en,fr}.json", { eager: true })

  const globalLocales = import.meta.glob("./locales/*.{en,fr}.json", { eager: true })

  const allLocales = { ...featureLocales, ...globalLocales }

  const resources: Record<string, Record<string, string>> = {
    en: {},
    fr: {},
  }

  // Process each locale file and merge by language
  for (const [filePath, module] of Object.entries(allLocales)) {
    const moduleObj = module as Record<string, unknown>
    const content = (moduleObj.default || moduleObj) as Record<string, string>

    // Determine language from filename (.en.json or .fr.json)
    const language = filePath.includes(".en.json") ? "en" : "fr"

    // Merge the locale content into the appropriate language
    if (content && typeof content === "object") {
      const r = resources[language]
      if (r) Object.assign(r, content)
    }
  }

  return resources
}

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // register custom post-processor
  .use(colonHandlerPostProcessor)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    postProcess: ["colonHandler"],
    resources: loadLocaleResources(),
  })

export default i18n
