import i18n, { type PostProcessorModule } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import agentExtractionRunEN from "./features/agent-extraction-runs/locales/agent-extraction-run.en.json"
import agentExtractionRunFR from "./features/agent-extraction-runs/locales/agent-extraction-run.fr.json"
import agentMessageFeedbackEN from "./features/agent-message-feedback/locales/agent-message-feedback.en.json"
import agentMessageFeedbackFR from "./features/agent-message-feedback/locales/agent-message-feedback.fr.json"
import agentSessionEN from "./features/agent-sessions/locales/agent-session.en.json"
import agentSessionFR from "./features/agent-sessions/locales/agent-session.fr.json"
import agentEN from "./features/agents/locales/agent.en.json"
import agentFR from "./features/agents/locales/agent.fr.json"
import documentEN from "./features/documents/locales/document.en.json"
import documentFR from "./features/documents/locales/document.fr.json"
import evaluationReportEN from "./features/evaluation-reports/locales/evaluation-report.en.json"
import evaluationReportFR from "./features/evaluation-reports/locales/evaluation-report.fr.json"
import evaluationEN from "./features/evaluations/locales/evaluation.en.json"
import evaluationFR from "./features/evaluations/locales/evaluation.fr.json"
import meEN from "./features/me/locales/me.en.json"
import meFR from "./features/me/locales/me.fr.json"
import notificationEN from "./features/notifications/locales/notification.en.json"
import notificationFR from "./features/notifications/locales/notification.fr.json"
import organizationEN from "./features/organizations/locales/organization.en.json"
import organizationFR from "./features/organizations/locales/organization.fr.json"
import projectMembershipEN from "./features/project-memberships/locales/project-membership.en.json"
import projectMembershipFR from "./features/project-memberships/locales/project-membership.fr.json"
import projectEN from "./features/projects/locales/project.en.json"
import projectFR from "./features/projects/locales/project.fr.json"
import actionsEN from "./locales/actions.en.json"
import actionsFR from "./locales/actions.fr.json"
import statusEN from "./locales/status.en.json"
import statusFR from "./locales/status.fr.json"

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
    resources: {
      en: {
        ...actionsEN,
        ...statusEN,
        ...agentEN,
        ...agentMessageFeedbackEN,
        ...agentExtractionRunEN,
        ...agentSessionEN,
        ...documentEN,
        ...evaluationReportEN,
        ...evaluationEN,
        ...meEN,
        ...notificationEN,
        ...organizationEN,
        ...projectMembershipEN,
        ...projectEN,
      },
      fr: {
        ...actionsFR,
        ...statusFR,
        ...agentFR,
        ...agentMessageFeedbackFR,
        ...agentExtractionRunFR,
        ...agentSessionFR,
        ...documentFR,
        ...evaluationReportFR,
        ...evaluationFR,
        ...meFR,
        ...notificationFR,
        ...organizationFR,
        ...projectMembershipFR,
        ...projectFR,
      },
    },
  })

export default i18n
