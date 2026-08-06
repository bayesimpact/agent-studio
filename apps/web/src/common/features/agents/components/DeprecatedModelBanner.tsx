import { type AgentModel, getAgentModelDeprecation } from "@caseai-connect/api-contracts"
import { Alert, AlertDescription, AlertTitle } from "@caseai-connect/ui/shad/alert"
import { TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { buildDate } from "@/common/utils/build-date"

/**
 * Warns that a model is being retired and names its replacement. Renders nothing when the model
 * is supported, so callers mount it unconditionally — declaring a future deprecation in
 * `AgentModelMetadataMap` is enough to surface it here.
 *
 * Not dismissible: migrating is mandatory, not advisory.
 */
export function DeprecatedModelBanner({ model }: { model: AgentModel }) {
  const { t } = useTranslation()
  const deprecation = getAgentModelDeprecation(model)

  if (!deprecation) return null

  const interpolation = {
    model,
    replacement: deprecation.recommendedReplacement,
    // `new Date("2026-09-30")` parses as UTC midnight, which formats as 29 September in any
    // negative-offset timezone. Appending the time forces local-midnight parsing instead.
    date: buildDate(new Date(`${deprecation.deprecatedOn}T00:00:00`).getTime(), "dd MMMM yyyy"),
  }

  return (
    <Alert variant="destructive" className="bg-orange-50/50 border-orange-200">
      <TriangleAlertIcon />
      <AlertTitle className="font-semibold">
        {t("agent:model.deprecation.title", interpolation)}
      </AlertTitle>
      <AlertDescription>
        <span className="text-red-950">
          {t("agent:model.deprecation.description", interpolation)}
        </span>
      </AlertDescription>
    </Alert>
  )
}
