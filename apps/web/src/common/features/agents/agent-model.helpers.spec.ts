import {
  AgentModel,
  AgentModelMetadataMap,
  DEFAULT_AGENT_MODEL,
  getAgentModelDeprecation,
  isAgentModelServedOutsideEu,
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

  it("treats a model that is no longer in the enum as not deprecated", () => {
    // `agent_settings.model` is an unconstrained varchar, so a row can hold a model that has been
    // dropped from `AgentModel` (exactly what retiring the 2.5 models will produce). Reading the
    // catalog must answer "unknown", not throw — the banner renders inside the agent subtree and
    // there is no error boundary above it.
    expect(() => getAgentModelDeprecation("gemini-2.5-flash")).not.toThrow()
    expect(getAgentModelDeprecation("gemini-1.5-flash-retired")).toBeUndefined()
    expect(getAgentModelDeprecation("")).toBeUndefined()
  })

  it("reports only the non-EU model as served outside the EU", () => {
    const servedOutsideEu = Object.values(AgentModel).filter((model) =>
      isAgentModelServedOutsideEu(model),
    )

    expect(servedOutsideEu).toEqual([AgentModel.Gemini36Flash])
  })

  it("treats an unknown model as EU-served rather than throwing", () => {
    expect(() => isAgentModelServedOutsideEu("gemini-1.5-flash-retired")).not.toThrow()
    expect(isAgentModelServedOutsideEu("gemini-1.5-flash-retired")).toBe(false)
  })
})

describe("formatAgentModelLabel", () => {
  const labels = { deprecatedSuffix: "(deprecated)", nonEuSuffix: "(non-EU)" }

  it("appends the deprecated suffix to a deprecated model", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini25Flash, labels)).toBe(
      "gemini-2.5-flash (deprecated)",
    )
  })

  it("leaves a supported EU-served model untouched", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini35FlashLite, labels)).toBe(
      "gemini-3.5-flash-lite",
    )
  })

  it("appends the residency suffix to the model served outside the EU", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini36Flash, labels)).toBe(
      "gemini-3.6-flash (non-EU)",
    )
  })

  it("does not mark the other vertex 3 models as non-EU", () => {
    expect(formatAgentModelLabel(AgentModel.Gemini31FlashLite, labels)).toBe(
      "gemini-3.1-flash-lite",
    )
    expect(formatAgentModelLabel(AgentModel.Gemini35Flash, labels)).toBe("gemini-3.5-flash")
  })

  it("appends both suffixes when a model is deprecated and served outside the EU", () => {
    // No catalog entry carries both facts today, so the combination is seeded on the real catalog
    // and restored: the assertion is about the formatter, not about the current data.
    const metadata = AgentModelMetadataMap[AgentModel.Gemini36Flash]
    const originalDeprecation = metadata.deprecation
    metadata.deprecation = {
      deprecatedOn: "2027-01-01",
      recommendedReplacement: AgentModel.Gemini35Flash,
    }

    try {
      expect(formatAgentModelLabel(AgentModel.Gemini36Flash, labels)).toBe(
        "gemini-3.6-flash (deprecated) (non-EU)",
      )
    } finally {
      metadata.deprecation = originalDeprecation
    }
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
