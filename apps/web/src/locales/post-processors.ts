import type { PostProcessorModule } from "i18next"

/**
 * Custom post-processor for handling colon formatting
 * Adds language-specific spacing before colons (French uses space, others don't)
 */
export const colonHandlerPostProcessor: PostProcessorModule = {
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
