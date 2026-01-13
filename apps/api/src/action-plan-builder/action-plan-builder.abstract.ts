import { type FunctionCall, type FunctionDeclaration, Type } from "@google/genai"
import type { AIServiceProvider } from "../common/interfaces/ai-service.interface"

export type CTAType = "url" | "phone" | "email"

export interface CTA {
  name: string
  type: CTAType
  value: string
}

export interface Action {
  id: string
  categories: string[]
  content: string
  title: string
  cta?: CTA
}

export interface ActionPlanBuilderArgs {
  currentActionPlan?: Action
  profileText: string
  country?: string
}

export interface ActionPlanBuilderOptions {
  onProgress?: (message: string) => void
}

export abstract class AbstractActionPlanBuilderService implements AIServiceProvider {
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: "build_action_plan",
      description:
        "Build or update an action plan based on the beneficiary profile. This generates a structured action plan with specific steps.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          profileText: {
            type: Type.STRING,
            description:
              "Full text description of the beneficiary profile including their situation, needs, skills, and goals",
          },
          country: {
            type: Type.STRING,
            description:
              "Country code (ISO 3166-1 alpha-2) select the country based on the conversation context",
          },
        },
        required: ["profileText", "country"],
      },
    }
  }

  getPromptContext(): string {
    return `
### Tool: \`build_action_plan\`
**Description**: Build or update a personalized action plan for a beneficiary based on their profile.

**Parameters**:
- \`profileText\`: Full text description of the beneficiary's profile, situation, needs, skills, and goals

**Returns**: A structured action plan as an array of Action objects

**When to use**:
- Use this to create an action plan about a beneficiary's situation
- Use this to UPDATE an existing action plan when new information is provided or circumstances change

**Example Usage**:
- Creating new plan: build_action_plan(profileText="Jean is 35 years old, looking for work in IT, has experience in web development")
`
  }

  async executeFunction(
    functionCall: FunctionCall,
    options?: ActionPlanBuilderOptions,
  ): Promise<{
    success: boolean
    actionPlan: Action[]
    message: string
  }> {
    const args = functionCall.args as unknown as ActionPlanBuilderArgs

    const result = await this.buildActionPlan(args, options)

    return {
      success: true,
      actionPlan: result.actionPlan,
      message: `Action plan generated with ${result.actionPlan.length} actions`,
    }
  }

  abstract buildActionPlan(
    args: ActionPlanBuilderArgs,
    options?: ActionPlanBuilderOptions,
  ): Promise<{ actionPlan: Action[] }>
}
