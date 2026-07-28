import type { StepResult, StopCondition, ToolSet } from "ai"
import { buildToolLoopStopConditions, MAX_TOOL_LOOP_STEPS } from "./tool-loop-stop-conditions"

const buildStep = ({
  text = "",
  toolNames = [],
}: {
  text?: string
  toolNames?: string[]
}): StepResult<ToolSet> =>
  ({
    text,
    toolCalls: toolNames.map((toolName) => ({ toolName })),
  }) as StepResult<ToolSet>

const evaluate = async (
  conditions: StopCondition<ToolSet>[],
  steps: StepResult<ToolSet>[],
): Promise<boolean> => {
  for (const condition of conditions) {
    if (await condition({ steps })) return true
  }
  return false
}

describe("buildToolLoopStopConditions", () => {
  it("only caps the step count when no tool is terminal", () => {
    const conditions = buildToolLoopStopConditions()

    expect(conditions).toHaveLength(1)
  })

  it("stops the loop when a terminal tool is called after the answer", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    const stops = await evaluate(conditions, [
      buildStep({ toolNames: ["lookup_knowledge_base"] }),
      buildStep({ text: "Onboarding lasts two weeks.", toolNames: ["sources"] }),
    ])

    expect(stops).toBe(true)
  })

  it("lets the model answer when it calls the terminal tool before writing anything", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    const stops = await evaluate(conditions, [buildStep({ toolNames: ["sources"] })])

    expect(stops).toBe(false)
  })

  it("keeps looping when only an earlier step produced text", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    // A model that cannot mix text and tool calls: a preamble, then the citation
    // step, then the answer it still owes the user.
    const stops = await evaluate(conditions, [
      buildStep({ text: "Let me look this up.", toolNames: ["lookup_knowledge_base"] }),
      buildStep({ toolNames: ["sources"] }),
    ])

    expect(stops).toBe(false)
  })

  it("keeps looping for tools that are not terminal", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    const stops = await evaluate(conditions, [
      buildStep({ text: "Let me look this up.", toolNames: ["lookup_knowledge_base"] }),
    ])

    expect(stops).toBe(false)
  })

  it("only stops on the step that called the terminal tool", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    const stops = await evaluate(conditions, [
      buildStep({ text: "Onboarding lasts two weeks.", toolNames: ["sources"] }),
      buildStep({ text: "Anything else?", toolNames: ["fillForm"] }),
    ])

    expect(stops).toBe(false)
  })

  it("stops after the maximum number of steps", async () => {
    const conditions = buildToolLoopStopConditions(["sources"])

    const stops = await evaluate(
      conditions,
      Array.from({ length: MAX_TOOL_LOOP_STEPS }, () =>
        buildStep({ toolNames: ["lookup_knowledge_base"] }),
      ),
    )

    expect(stops).toBe(true)
  })
})
