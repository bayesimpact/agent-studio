import type { StepResult, ToolSet } from "ai"
import { fireAndForgetStopCondition } from "@/external/llm/fire-and-forget-stop-condition"

function buildStep({
  text = "",
  toolNames = [],
}: {
  text?: string
  toolNames?: string[]
}): StepResult<ToolSet> {
  return {
    text,
    toolCalls: toolNames.map((toolName) => ({ toolName })),
  } as unknown as StepResult<ToolSet>
}

describe("fireAndForgetStopCondition", () => {
  const condition = fireAndForgetStopCondition({
    fireAndForgetToolNames: ["sources", "surfaceResources"],
  })

  it("should stop when the step only calls fire-and-forget tools alongside a text answer", async () => {
    const steps = [buildStep({ text: "You get 25 days of paid leave.", toolNames: ["sources"] })]
    expect(await condition({ steps })).toBe(true)
  })

  it("should stop when several fire-and-forget tools are called in the same step", async () => {
    const steps = [
      buildStep({ text: "Here is what I found.", toolNames: ["sources", "surfaceResources"] }),
    ]
    expect(await condition({ steps })).toBe(true)
  })

  it("should stop when the text was produced in an earlier step", async () => {
    const steps = [
      buildStep({ text: "Answer given in a previous step." }),
      buildStep({ toolNames: ["sources"] }),
    ]
    expect(await condition({ steps })).toBe(true)
  })

  it("should not stop when no text was produced yet", async () => {
    const steps = [buildStep({ toolNames: ["sources"] })]
    expect(await condition({ steps })).toBe(false)
  })

  it("should not stop when the step mixes fire-and-forget and round-trip tools", async () => {
    const steps = [
      buildStep({ text: "Looking it up.", toolNames: ["sources", "lookup_knowledge_base"] }),
    ]
    expect(await condition({ steps })).toBe(false)
  })

  it("should not stop when the step only calls round-trip tools", async () => {
    const steps = [buildStep({ text: "Looking it up.", toolNames: ["lookup_knowledge_base"] })]
    expect(await condition({ steps })).toBe(false)
  })

  it("should not stop when the step has no tool calls", async () => {
    const steps = [buildStep({ text: "Plain answer without tools." })]
    expect(await condition({ steps })).toBe(false)
  })

  it("should not stop when there are no steps", async () => {
    expect(await condition({ steps: [] })).toBe(false)
  })

  it("should ignore whitespace-only text when deciding whether an answer exists", async () => {
    const steps = [buildStep({ text: "  \n", toolNames: ["sources"] })]
    expect(await condition({ steps })).toBe(false)
  })
})
