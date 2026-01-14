import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';

interface TrainingProgram {
  name: string;
  description: string;
}

@Injectable()
export class TrainingProgramsService implements AIServiceProvider {
  private readonly notionApiUrl =
    process.env.NOTION_API_URL || 'https://api.notion.com/v1';
  private readonly notionSecret = process.env.NOTION_SECRET;
  private readonly notionTrainingProgramsDatabaseId =
    process.env.NOTION_TRAINING_PROGRAMS_DATABASE_ID || '2e77d19cc82580ea97bdc484aff777c8';

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'training_programs_search',
      description: 'Search for career training and certification programs in Columbus, OH area. Includes advanced manufacturing, welding, CNC machining, electrical systems, and other skilled trade programs with specific start dates and schedules. Call this tool ONCE per turn with all needed skill areas.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          skillAreas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of skills or trades needed (e.g., ["welding", "manufacturing"], or ["electrical", "CNC machining"])',
          },
          location: {
            type: Type.STRING,
            description: 'Location (e.g., "Columbus, OH")',
          },
        },
        required: ['skillAreas', 'location'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`training_programs_search\`
**Description**: Search for structured career training and certification programs from Notion database. These are multi-week/month programs leading to industry-recognized credentials.

**IMPORTANT**: Call this tool ONLY ONCE per turn. Use an array to request multiple skill areas in a single call.

**Parameters**:
- \`skillAreas\`: Array of skills or trade areas needed
  - Examples: ["welding"], ["advanced manufacturing", "CNC machining"], ["electrical systems"]
- \`location\`: Geographic area (required)
  - Example: "Columbus, OH"

**Returns**: Detailed training program information including:
- Program overview and career opportunities
- Training providers and locations
- Specific class schedules (start/end dates, days, times)
- Eligibility requirements (age, diploma, assessments)
- Funding assistance information (e.g., OhioMeansJobs)
- Program links and application processes

**When to use**:
- When beneficiary needs job-specific technical skills training
- For career changers seeking certification in skilled trades
- When beneficiary wants structured multi-week training programs
- For individuals seeking industry-recognized credentials
- When funding support for training is needed
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{ trainingPrograms: string }> {
    const skillAreas = (functionCall.args['skillAreas'] as string[]) || [];
    const location = functionCall.args['location'] as string;

    console.log('Training programs search with params:', { skillAreas, location });

    const programs = await this.searchTrainingPrograms();

    // Combine all relevant program contents
    const combinedContent = programs.map(p =>
      `# ${p.name}\n\n${p.description}`
    ).join('\n\n---\n\n');

    console.log(`✅ Training programs search returned ${programs.length} programs`);
    return { trainingPrograms: combinedContent };
  }

  async searchTrainingPrograms(): Promise<TrainingProgram[]> {
    if (!this.notionSecret) {
      console.error('NOTION_SECRET is not configured');
      return [];
    }

    try {
      console.log('Fetching training programs from Notion');

      const queryBody = {
        page_size: 100,
      };

      const { data } = await axios.post<any>(
        `${this.notionApiUrl}/databases/${this.notionTrainingProgramsDatabaseId}/query`,
        queryBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.notionSecret}`,
            'Notion-Version': '2022-06-28',
          },
        },
      );

      if (!data.results || data.results.length === 0) {
        console.log('No training programs found in Notion database');
        return [];
      }

      console.log(`Found ${data.results.length} training programs in Notion database`);

      return this.parseNotionPages(data.results);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Notion API error:',
          error.response?.status,
          error.response?.data,
        );
      } else {
        console.error('Error fetching training programs:', error);
      }
      return [];
    }
  }

  private parseNotionPages(pages: any[]): TrainingProgram[] {
    return pages.map((page) => {
      const properties = page.properties;

      // Get title from "Name" property
      const name = properties['Name']?.title?.[0]?.plain_text || 'Untitled Program';

      // Get full description from "Description" rich text property
      const descriptionParts = properties['Description']?.rich_text || [];
      const description = descriptionParts
        .map((part: any) => part.plain_text || '')
        .join('');

      return {
        name,
        description,
      };
    });
  }

  formatResultsForPrompt(result: { trainingPrograms: string }): string {
    const { trainingPrograms } = result;

    if (!trainingPrograms) {
      return `**Training Programs**: No programs found.`;
    }

    return `**Career Training & Certification Programs**

${trainingPrograms}

**How to use this information**:
- These are structured multi-week/month training programs (NOT one-time workshops)
- Programs lead to industry-recognized certifications and credentials
- Include specific schedules, start dates, and training providers
- Mention funding opportunities (e.g., OhioMeansJobs assistance for eligible individuals)
- Highlight eligibility requirements (age 18+, HS diploma, transportation)
- Reference specific career outcomes (Machine Operator, Welding, CNC Machining, etc.)
- Include real program links when creating actions
- Emphasize hands-on training and job-ready credentials
- For career changers or those seeking skilled trade careers
`;
  }
}