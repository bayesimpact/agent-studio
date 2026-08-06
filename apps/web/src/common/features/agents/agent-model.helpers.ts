import {
  AgentModel,
  AgentModelToAgentProvider,
  AgentProvider,
  getAgentModelDeprecation,
  isAgentModelServedOutsideEu,
} from "@caseai-connect/api-contracts"
import type { HasFeature } from "@/common/hooks/use-feature-flags"

/**
 * Models a project may choose from, in enum declaration order.
 *
 * Single source of truth for provider gating: `AgentModelTab` and the eval judge picker both
 * call this, so a new provider or a new gate is one change here.
 */
export function buildAgentModelOptions(hasFeature: HasFeature): AgentModel[] {
  const providers: AgentProvider[] = [
    // Vertex3 is never gated: it holds the recommended replacements for the deprecated Vertex
    // models, so hiding it would leave a project unable to migrate off them.
    AgentProvider.Vertex,
    AgentProvider.Vertex3,
  ]
  if (hasFeature("medgemma")) providers.push(AgentProvider.MedGemma)
  if (hasFeature("gemma")) providers.push(AgentProvider.Gemma)
  if (hasFeature("mistral")) providers.push(AgentProvider.Mistral)

  // AgentModel._Mock drops out naturally — its provider is never in the list.
  return Object.values(AgentModel).filter((model) =>
    providers.includes(AgentModelToAgentProvider[model]),
  )
}

/** Already-translated suffixes a model label can carry. Both can apply to the same model. */
export type AgentModelLabelSuffixes = {
  deprecatedSuffix: string
  nonEuSuffix: string
}

/**
 * Option label for a model in a select: the model id plus whichever catalog facts apply, in the
 * order urgency dictates (retirement first, residency second). Pass the already-translated
 * suffixes so this stays a pure function.
 */
export function formatAgentModelLabel(
  model: AgentModel,
  { deprecatedSuffix, nonEuSuffix }: AgentModelLabelSuffixes,
): string {
  const suffixes = [
    getAgentModelDeprecation(model) ? deprecatedSuffix : undefined,
    isAgentModelServedOutsideEu(model) ? nonEuSuffix : undefined,
  ].filter((suffix) => suffix !== undefined)

  return [model, ...suffixes].join(" ")
}
