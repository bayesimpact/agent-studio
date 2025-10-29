import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { FunctionDeclaration, Type } from '@google/genai';

export type CTAType = 'url' | 'phone' | 'email';

export interface CTA {
  name: string;
  type: CTAType;
  value: string;
}

export interface Action {
  id: string;
  categories: string[];
  content: string;
  title: string;
  cta?: CTA;
}

export interface CarePlanBuilderArgs {
  currentCarePlan?: Action[];
  profileText: string;
}

export interface CarePlanBuilderOptions {
  onProgress?: (message: string) => void;
}

export abstract class AbstractCarePlanBuilderService
  implements AIServiceProvider
{
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'build_care_plan',
      description:
        'Build or update a care plan based on the beneficiary profile. This generates a structured action plan with specific steps.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          currentCarePlan: {
            type: Type.ARRAY,
            description:
              'Optional array of the current care plan actions to update or refine. Each action has id, categories, title, content, and optional cta.',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                categories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                cta: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'Display text for the call-to-action button'
                    },
                    type: {
                      type: Type.STRING,
                      description: 'Type of CTA: "url" for web links, "phone" for phone numbers, "email" for email addresses',
                      enum: ['url', 'phone', 'email']
                    },
                    value: {
                      type: Type.STRING,
                      description: 'The actual value: URL for "url" type, phone number for "phone" type (format: +33123456789), email address for "email" type'
                    },
                  },
                  required: ['name', 'type', 'value']
                },
              },
            },
          },
          profileText: {
            type: Type.STRING,
            description:
              'Full text description of the beneficiary profile including their situation, needs, skills, and goals',
          },
        },
        required: ['profileText'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`build_care_plan\`
**Description**: Build or update a personalized care plan for a beneficiary based on their profile.

**Parameters**:
- \`currentCarePlan\`: (Optional) Array of existing Action objects in the care plan. Each action has:
  - \`id\`: Unique identifier
  - \`categories\`: Array of category tags (e.g., ["Emploi", "Formation"])
  - \`title\`: Short title of the action
  - \`content\`: Detailed description
  - \`cta\`: Optional call-to-action object with:
    - \`name\`: Display text for the button (required)
    - \`type\`: Type of action - "url", "phone", or "email" (required)
    - \`value\`: The actual value - URL, phone number (format: +33123456789), or email address (required)
- \`profileText\`: Full text description of the beneficiary's profile, situation, needs, skills, and goals

**Returns**: A structured care plan as an array of Action objects

**When to use**:
- Use this to create a NEW care plan when you first learn about a beneficiary's situation
- Use this to UPDATE an existing care plan when new information is provided or circumstances change
- Pass the existing \`currentCarePlan\` array when updating so the AI can refine/modify it

**Example Usage**:
- Creating new plan: build_care_plan(profileText="Jean is 35 years old, looking for work in IT, has experience in web development")
- Updating existing plan: build_care_plan(currentCarePlan=[...existing actions...], profileText="Jean just completed a React certification")
`;
  }

  async executeFunction(
    functionCall: any,
    options?: CarePlanBuilderOptions,
  ): Promise<any> {
    const args = functionCall.args as CarePlanBuilderArgs;

    const result = await this.buildCarePlan(args, options);

    return {
      success: true,
      carePlan: result.carePlan,
      message: `Care plan generated with ${result.carePlan.length} actions`,
    };
  }

  abstract buildCarePlan(
    args: CarePlanBuilderArgs,
    options?: CarePlanBuilderOptions,
  ): Promise<{ carePlan: Action[] }>;
}