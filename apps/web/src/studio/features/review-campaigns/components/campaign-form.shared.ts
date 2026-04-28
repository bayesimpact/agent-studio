import type {
  ReviewCampaignQuestionDto,
  ReviewCampaignQuestionType,
} from "@caseai-connect/api-contracts"
import type { TFunction } from "i18next"
import type { CampaignFormValues } from "./CampaignForm"

/**
 * Default values used to pre-fill the create-campaign sheet.
 *
 * Mirrors the pattern in `apps/web/src/studio/features/agents/components/agent-form.shared.ts`:
 * a pure factory that returns localized defaults at form-mount.
 *
 * Question structure (`type`, `required`, `isFactual`, option keys) lives here
 * in TypeScript so we don't duplicate structural data across EN/FR JSON. Only
 * the prompts and option labels are translated via `t()`.
 */

type DefaultQuestionTemplate = {
  /** Last segment of the i18n key under `reviewCampaigns.defaults.<list>.<key>` */
  key: string
  type: ReviewCampaignQuestionType
  required: boolean
  /** Tester per-session only — controls reviewer blind-review visibility */
  isFactual?: boolean
  /** For `single-choice` only — option keys under `<key>.options.<optionKey>` */
  optionKeys?: string[]
}

const DEFAULT_PER_SESSION_QUESTIONS: DefaultQuestionTemplate[] = [
  { key: "q1", type: "rating", required: true },
  {
    key: "q2",
    type: "single-choice",
    required: true,
    isFactual: true,
    optionKeys: ["yes", "partially", "no"],
  },
]

const DEFAULT_END_OF_PHASE_QUESTIONS: DefaultQuestionTemplate[] = [
  { key: "q1", type: "rating", required: true },
]

const DEFAULT_REVIEWER_QUESTIONS: DefaultQuestionTemplate[] = [
  { key: "q1", type: "rating", required: true },
]

function buildDefaultQuestion(
  t: TFunction,
  list: "perSession" | "endOfPhase" | "reviewer",
  template: DefaultQuestionTemplate,
): ReviewCampaignQuestionDto {
  const base: ReviewCampaignQuestionDto = {
    id: crypto.randomUUID(),
    prompt: t(`reviewCampaigns:defaults.${list}.${template.key}.prompt`),
    type: template.type,
    required: template.required,
  }
  if (template.isFactual !== undefined) {
    base.isFactual = template.isFactual
  }
  if (template.optionKeys) {
    base.options = template.optionKeys.map((optionKey) =>
      t(`reviewCampaigns:defaults.${list}.${template.key}.options.${optionKey}`),
    )
  }
  return base
}

function formatDate(language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date())
}

export function computeAutoCampaignName({
  t,
  language,
  agentName,
}: {
  t: TFunction
  language: string
  agentName?: string
}): string {
  const date = formatDate(language)
  if (agentName) {
    return t("reviewCampaigns:defaults.campaignName", { agent: agentName, date })
  }
  return t("reviewCampaigns:defaults.campaignNameNoAgent", { date })
}

export function getDefaultCampaignValues({
  t,
  language,
}: {
  t: TFunction
  language: string
}): Partial<CampaignFormValues> {
  return {
    name: computeAutoCampaignName({ t, language }),
    description: t("reviewCampaigns:defaults.description"),
    testerPerSessionQuestions: DEFAULT_PER_SESSION_QUESTIONS.map((template) =>
      buildDefaultQuestion(t, "perSession", template),
    ),
    testerEndOfPhaseQuestions: DEFAULT_END_OF_PHASE_QUESTIONS.map((template) =>
      buildDefaultQuestion(t, "endOfPhase", template),
    ),
    reviewerQuestions: DEFAULT_REVIEWER_QUESTIONS.map((template) =>
      buildDefaultQuestion(t, "reviewer", template),
    ),
  }
}
