import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import type { Agent } from "@/common/features/agents/agents.models"

/** Settings fields that are versioned by the backend (one revision per change). */
export const agentSettingsDiffKeys = [
  "instructions",
  "greetingMessage",
  "model",
  "temperature",
  "locale",
  "documentsRagMode",
  "outputJsonSchema",
  "fillFormEnabled",
] as const

export type AgentSettingsDiffKey = (typeof agentSettingsDiffKeys)[number]

/** The file name drives @pierre/diffs syntax highlighting (md for prose, json for the schema). */
export const agentSettingsDiffFileNames: Record<AgentSettingsDiffKey, string> = {
  instructions: "instructions.md",
  greetingMessage: "greeting-message.md",
  model: "model.txt",
  temperature: "temperature.txt",
  locale: "language.txt",
  documentsRagMode: "documents-rag-mode.txt",
  outputJsonSchema: "output-json-schema.json",
  fillFormEnabled: "fill-form-enabled.txt",
}

export const agentSettingsDiffLabelKeys: Record<AgentSettingsDiffKey, string> = {
  instructions: "agent:props.instructions",
  greetingMessage: "agent:props.greeting",
  model: "agent:props.model",
  temperature: "agent:props.temperature",
  locale: "agent:props.locale",
  documentsRagMode: "agent:props.documentsRagMode",
  outputJsonSchema: "agent:props.outputJsonSchema",
  fillFormEnabled: "agent:props.fillFormEnabled",
}

export function serializeAgentSettingsField(agent: Agent, key: AgentSettingsDiffKey): string {
  const value = agent[key]
  if (value === undefined || value === null) return ""
  if (key === "outputJsonSchema") return JSON.stringify(value, null, 2)
  return String(value)
}

export function listChangedAgentSettingsFields(
  before: Agent,
  after: Agent,
): AgentSettingsDiffKey[] {
  return agentSettingsDiffKeys.filter(
    (key) => serializeAgentSettingsField(before, key) !== serializeAgentSettingsField(after, key),
  )
}

/**
 * The published revision the agent actually runs with: the newest one that is not a draft.
 * `versions` is ordered by revision descending, as the history endpoint returns it.
 */
export function findPublishedVersion(versions: Agent[]): Agent | undefined {
  return versions.find((version) => !version.isDraft)
}

/** The version carrying `revision`, when the history list is loaded and contains it. */
export function findVersion(versions: Agent[], revision: number): Agent | undefined {
  return versions.find((version) => version.revision === revision)
}

/**
 * Revision to label a message with: the one the API recorded on it.
 *
 * Messages built client-side during streaming have no revision yet and are never refetched,
 * so they fall back to the published revision — which is exactly what streaming ran. Those
 * are recognisable by having no `createdAt`; every persisted message carries one.
 *
 * A persisted message with no revision must NOT fall back: labelling an old message with the
 * published revision would claim it is the latest version. Returns `undefined` instead, so
 * the caller hides the badge rather than showing a wrong number.
 */
export function resolveMessageRevision(
  message: AgentSessionMessage,
  versions: Agent[],
): number | undefined {
  if (message.agentRevision !== undefined) return message.agentRevision
  const isPersisted = message.createdAt !== undefined
  return isPersisted ? undefined : findPublishedVersion(versions)?.revision
}
