import {
  AgentModel,
  AgentModelMetadataMap,
  DEFAULT_AGENT_MODEL,
  getAgentModelDeprecation,
} from "@caseai-connect/api-contracts"
import { describe, expect, it } from "vitest"
import type { HasFeature } from "@/common/hooks/use-feature-flags"
import { buildAgentModelOptions, formatAgentModelLabel } from "./agent-model.helpers"

describe("AgentModelMetadataMap", () => {
  it("has an entry for every model", () => {
    const missing = Object.values(AgentModel).filter((model) => !AgentModelMetadataMap[model])

    expect(missing).toEqual([])
  })

  it("never recommends a replacement that is itself deprecated", () => {
    const selfDefeating = Object.values(AgentModel).filter((model) => {
      const replacement = getAgentModelDeprecation(model)?.recommendedReplacement
      return !!replacement && !!getAgentModelDeprecation(replacement)
    })

    expect(selfDefeating).toEqual([])
  })

  it("uses ISO dates for every deprecation", () => {
    const badDates = Object.values(AgentModel)
      .map((model) => getAgentModelDeprecation(model)?.deprecatedOn)
      .filter((date) => date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date))

    expect(badDates).toEqual([])
  })

  it("marks the gemini 2.5 models as deprecated on 2026-09-30", () => {
    expect(getAgentModelDeprecation(AgentModel.Gemini25Flash)).toEqual({
      deprecatedOn: "2026-09-30",
      recommendedReplacement: AgentModel.Gemini35FlashLite,
    })
    expect(getAgentModelDeprecation(AgentModel.Gemini25Pro)).toEqual({
      deprecatedOn: "2026-09-30",
      recommendedReplacement: AgentModel.Gemini35Flash,
    })
  })

  it("does not deprecate the default model", () => {
    expect(getAgentModelDeprecation(DEFAULT_AGENT_MODEL)).toBeUndefined()
  })
})

describe("formatAgentModelLabel", () => {
  it("appends the suffix to a deprecated model", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini25Flash, "(deprecated)")).toBe(
      "gemini-2.5-flash (deprecated)",
    )
  })

  it("leaves a supported model untouched", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini35FlashLite, "(deprecated)")).toBe(
      "gemini-3.5-flash-lite",
    )
  })
})

describe("buildAgentModelOptions", () => {
  const noFlags: HasFeature = () => false

  it("always offers the vertex and vertex 3 models", () => {
    expect(buildAgentModelOptions(noFlags)).toEqual([
      AgentModel.Gemini25Flash,
      AgentModel.Gemini25Pro,
      AgentModel.Gemini31FlashLite,
      AgentModel.Gemini35FlashLite,
      AgentModel.Gemini35Flash,
      AgentModel.Gemini36Flash,
    ])
  })

  it("keeps the recommended replacements available with no flags enabled", () => {
    const options = buildAgentModelOptions(noFlags)
    const replacements = Object.values(AgentModel)
      .map((model) => getAgentModelDeprecation(model)?.recommendedReplacement)
      .filter((replacement) => replacement !== undefined)

    for (const replacement of replacements) {
      expect(options).toContain(replacement)
    }
  })

  it("adds a flagged provider's models only when its flag is on", () => {
    const options = buildAgentModelOptions((feature) => feature === "mistral")

    expect(options).toContain(AgentModel.MistralSmall31_24B)
    expect(options).not.toContain(AgentModel.Gemma4_26B)
    expect(options).not.toContain(AgentModel.MedGemma10_27B)
  })

  it("never offers the mock model", () => {
    expect(buildAgentModelOptions(() => true)).not.toContain(AgentModel._Mock)
  })
})
