import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration } from '@google/genai';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';

/**
 * Frontend provider for displaying a care plan
 * The LLM generates the structured care plan and calls this to display it
 */
@Injectable()
export class CarePlanProvider implements AIFrontendProvider {
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'display_care_plan',
      description:
        'Display a structured care plan with grouped items (job searches, services, etc.). Use this to show the case manager the action plan.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          planItems: {
            type: Type.ARRAY,
            description: 'Array of high-level care plan items that can be expanded',
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: 'Care plan item ID',
                },
                type: {
                  type: Type.STRING,
                  description: 'Type of item: "job_search" for job searches, "service" for support services',
                },
                title: {
                  type: Type.STRING,
                  description: 'High-level action title (e.g., "Find a developer job", "Housing assistance")',
                },
                description: {
                  type: Type.STRING,
                  description: 'Description in markdown format (used for service items without nested details)',
                },
                location: {
                  type: Type.STRING,
                  description: 'Location',
                },
                contact: {
                  type: Type.STRING,
                  description: 'Contact information (for services)',
                },
                serviceType: {
                  type: Type.STRING,
                  description: 'Service type or thematic (for services)',
                },
                // Nested items for both job searches and services
                items: {
                  type: Type.ARRAY,
                  description: 'Array of detailed items (job offers for job_search, service details for service)',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: {
                        type: Type.STRING,
                        description: 'Item ID',
                      },
                      title: {
                        type: Type.STRING,
                        description: 'Item title (job title or service name)',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Item description (markdown supported)',
                      },
                      location: {
                        type: Type.STRING,
                        description: 'Location',
                      },
                      // Job-specific fields
                      company: {
                        type: Type.STRING,
                        description: 'Company name (for job offers)',
                      },
                      contractType: {
                        type: Type.STRING,
                        description: 'Contract type (for job offers: CDI, CDD, etc.)',
                      },
                      // Service-specific fields
                      contact: {
                        type: Type.STRING,
                        description: 'Contact information (for services)',
                      },
                      serviceType: {
                        type: Type.STRING,
                        description: 'Service type (for services)',
                      },
                    },
                    required: ['id', 'title'],
                  },
                },
              },
              required: ['id', 'type', 'title'],
            },
          },
        },
        required: ['planItems'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`display_care_plan\`
**Description**: Display a structured care plan with high-level items that can be expanded.

**Plan structure**:
\`\`\`json
{
  "planItems": [
    {
      "id": "job-1",
      "type": "job_search",
      "title": "Find a developer job in Paris",
      "location": "Paris",
      "items": [
        {"id": "job-1", "title": "Full Stack Developer", "company": "TechCorp", "location": "Paris", "contractType": "Permanent", "description": "..."},
        {"id": "job-2", "title": "Backend Developer", "company": "StartupCo", "location": "Paris", "contractType": "Permanent", "description": "..."}
      ]
    },
    {
      "id": "housing-1",
      "type": "service",
      "title": "Housing assistance services",
      "location": "Paris",
      "items": [
        {"id": "svc-1", "title": "Rent arrears reduction", "description": "# Description\\n\\nThis service...", "contact": "01-23-45-67-89", "serviceType": "Housing"},
        {"id": "svc-2", "title": "Housing search assistance", "description": "# Description\\n\\n...", "contact": "01-98-76-54-32"}
      ]
    },
    {
      "id": "training-1",
      "type": "service",
      "title": "Professional training",
      "description": "# Overview\\n\\nSeveral trainings available...",
      "location": "Paris",
      "serviceType": "Training"
    }
  ]
}
\`\`\`

**Item types**:
- **\`job_search\`**: Groups multiple job offers under an action title (e.g., "Find a developer job")
  - **MUST** contain an \`items\` array with 3-10 selected job offers
  - Offers will be displayed when the user expands the item

- **\`service\`**: Display support services - **2 possible modes**:

  **Mode 1 - With structured details** (multiple similar services):
  - Contains an \`items\` array with 2-10 detailed services
  - Each service has: \`title\`, \`description\` (markdown), \`contact\`, \`serviceType\`
  - Used when you have multiple services of the same type (e.g., 3 different housing aids)

  **Mode 2 - Simple description** (single service):
  - No \`items\` array
  - Uses the \`description\` field (markdown) at the top level
  - Adds \`serviceType\` and \`contact\` at the top level
  - Used for a single service or an overview

**Usage rules**:
- Create 2-5 high-level items in the care plan
- For job searches, group offers by position type or domain
- Service descriptions must be in markdown and well formatted
- Your text response must be **short** (e.g., "Here is the proposed care plan.")
- **NEVER** list items in text (the interface does this visually)
`;
  }
}