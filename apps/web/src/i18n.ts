import i18n, { type PostProcessorModule } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "./locales/en.json"
import fr from "./locales/fr.json"

// Custom post-processor for handling colon
const colonHandlerPostProcessor: PostProcessorModule = {
  type: "postProcessor",
  name: "colonHandler",
  process(value, _, options, translator) {
    let result = value

    if (options?.colon) {
      // Add space before colon for French, no space for other languages
      const lng = translator.language
      const colonSeparator = lng === "fr" ? " :" : ":"
      result = result + colonSeparator
    }

    return result
  },
}

// Custom post-processor for handling cfl (capitalize first letter)
const cflHandlerPostProcessor: PostProcessorModule = {
  type: "postProcessor",
  name: "cflHandler",
  process(value, _, options) {
    let result = value

    if (options?.cfl) {
      result = Cfl(result)
    }

    return result
  },
}

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // register custom post-processor
  .use(cflHandlerPostProcessor)
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
    postProcess: ["cflHandler", "colonHandler"],
    resources: {
      en,
      fr,
    },
  })

export default i18n

/**
 * Capitalizes the first letter of the given string.
 *
 * @param str - The string to be capitalized.
 * @returns The input string with its first letter capitalized. If the input string is empty or undefined, returns 'Error: missing string'. If the input is not a string, returns 'Error: not a string'.
 */
function Cfl(str: string): string {
  if (typeof str !== "string") return "Error: not a string"
  else if (str) return str.charAt(0).toUpperCase() + str.slice(1)
  return "Error: missing string"
}
