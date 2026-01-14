import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';

interface CommunityProgram {
  name: string;
  description: string;
}

@Injectable()
export class CommunityProgramsService implements AIServiceProvider {
  private readonly notionApiUrl =
    process.env.NOTION_API_URL || 'https://api.notion.com/v1';
  private readonly notionSecret = process.env.NOTION_SECRET;
  private readonly notionCommunityProgramsDatabaseId =
    process.env.NOTION_COMMUNITY_PROGRAMS_DATABASE_ID || '2e77d19cc825803c964ecd706895529c';

  private dial211Services: CommunityProgram[] = [];

  constructor() {
    // Load all 211 JSON files from the 211rawjson folder
    const rawJsonDir = path.join(__dirname, '211rawjson');

    try {
      const files = fs.readdirSync(rawJsonDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`Loading ${jsonFiles.length} 211 JSON files from ${rawJsonDir}`);

      for (const file of jsonFiles) {
        const filePath = path.join(rawJsonDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        if (data.results && Array.isArray(data.results)) {
          const services = this.parse211Services(data.results);
          this.dial211Services.push(...services);
          console.log(`Loaded ${services.length} 211 services from ${file}`);
        }
      }

      console.log(`Total 211 services loaded: ${this.dial211Services.length}`);
    } catch (error) {
      console.error('Error loading 211 JSON files:', error);
    }
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'community_programs_search',
      description: 'Search for community programs, social services, and support resources in Columbus, OH area. Includes 211 services (food pantries, housing assistance, emergency services, health services) and career development programs (youth services, job training, mentorship, workforce development). Call this tool ONCE per turn with all needed program types.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          programTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of program or service types needed (e.g., ["career development", "food assistance"], or ["youth services", "housing"])',
          },
          location: {
            type: Type.STRING,
            description: 'Location (e.g., "Columbus, OH")',
          },
          ageRange: {
            type: Type.STRING,
            description: 'Age range of the beneficiary (e.g., "18-24", "25-35")',
          },
        },
        required: ['programTypes', 'location'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`community_programs_search\`
**Description**: Search for community programs, social services, and support resources in Columbus, OH area. Combines data from 211 services (food pantries, housing assistance, emergency services, health services) and career development programs from Notion (youth services, job training, mentorship, workforce development).

**IMPORTANT**: Call this tool ONLY ONCE per turn. Use an array to request multiple program types in a single call.

**Parameters**:
- \`programTypes\`: Array of program or service types needed
  - Career-related: ["career development"], ["youth services"], ["job training"], ["mentorship"], ["workforce development"]
  - Basic needs: ["food assistance"], ["housing"], ["emergency services"], ["health services"]
  - Combined: ["career development", "food assistance"] or ["youth services", "housing"]
- \`location\`: Geographic area (required)
  - Example: "Columbus, OH"
- \`ageRange\`: Age range of beneficiary (optional but recommended)
  - Examples: "18-24", "25-35", "youth"

**Returns**: Detailed program information including:
- Program/service overview and features
- Eligibility requirements
- Contact information and addresses
- Application process
- Benefits and support provided
- Service types and categories

**When to use**:
- When beneficiary needs career guidance and coaching (Notion programs)
- For out-of-school youth needing career pathways (Notion programs)
- When job training or skill development is needed (Notion programs)
- For beneficiaries needing personal advocacy and support (Notion programs)
- When beneficiary needs basic services like food, housing, or emergency assistance (211 services)
- For health services, transportation, or other social support (211 services)
- When long-term career sustainability is the goal (Notion programs)
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{ programs: string }> {
    const programTypes = (functionCall.args['programTypes'] as string[]) || [];
    const location = functionCall.args['location'] as string;
    const ageRange = functionCall.args['ageRange'] as string;

    console.log('Community programs search with params:', { programTypes, location, ageRange });

    const programs = await this.searchCommunityPrograms();

    // Combine all program contents (no filtering)
    const combinedContent = programs.map(p =>
      `# ${p.name}\n\n${p.description}`
    ).join('\n\n---\n\n');

    console.log(`✅ Community programs search returned ${programs.length} programs`);
    return { programs: this.formatResultsForPrompt({ programs: combinedContent }) };
  }

  async searchCommunityPrograms(): Promise<CommunityProgram[]> {
    const allPrograms: CommunityProgram[] = [];

    // Add 211 services
    allPrograms.push(...this.dial211Services);

    // Fetch Notion programs
    if (!this.notionSecret) {
      console.error('NOTION_SECRET is not configured, skipping Notion programs');
      return allPrograms;
    }

    try {
      console.log('Fetching community programs from Notion');

      const queryBody = {
        page_size: 100,
      };

      const { data } = await axios.post<any>(
        `${this.notionApiUrl}/databases/${this.notionCommunityProgramsDatabaseId}/query`,
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
        console.log('No community programs found in Notion database');
        return allPrograms;
      }

      console.log(`Found ${data.results.length} community programs in Notion database`);
      const notionPrograms = this.parseNotionPages(data.results);
      allPrograms.push(...notionPrograms);

      return allPrograms;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Notion API error:',
          error.response?.status,
          error.response?.data,
        );
      } else {
        console.error('Error fetching community programs:', error);
      }
      return allPrograms;
    }
  }

  private parse211Services(results: any[]): CommunityProgram[] {
    return results.map((service) => {
      const name = service.nameOrganization || service.nameService || 'Unnamed Service';
      const orgDescription = service.descriptionOrganization || '';
      const serviceDescription = service.descriptionService || '';
      const address = service.address;

      // Build address string
      let addressStr = '';
      if (address && address.streetAddress) {
        addressStr = `\n**Address**: ${address.streetAddress}, ${address.city}, ${address.stateProvince} ${address.postalCode}`;
      }

      // Get taxonomy/service type
      let serviceType = '';
      if (service.taxonomy && service.taxonomy.length > 0) {
        const taxonomyTerms = service.taxonomy.map((t: any) => t.taxonomyTerm).join(', ');
        serviceType = `\n**Service Type**: ${taxonomyTerms}`;
      }

      // Combine descriptions
      let description = '';
      if (orgDescription && serviceDescription && orgDescription !== serviceDescription) {
        description = `${orgDescription}\n\n${serviceDescription}`;
      } else {
        description = serviceDescription || orgDescription;
      }

      description += serviceType + addressStr;

      return {
        name,
        description,
      };
    });
  }

  private parseNotionPages(pages: any[]): CommunityProgram[] {
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

  formatResultsForPrompt(result: { programs: string }): string {
    const { programs } = result;

    if (!programs) {
      return `**Community Programs & 211 Services**: No programs found.`;
    }

    return `**Community Programs & 211 Services**

${programs}

**How to use this information**:
- This combines career development programs (from validated sources) and 211 social services (food, housing, health, etc.)
- Match program eligibility with beneficiary's age, status, and needs
- For career-focused support: Highlight programs that offer personal coaching and advocacy
- For basic needs: Use 211 services (food pantries, housing assistance, emergency services)
- Emphasize programs focused on long-term career pathways (not just immediate jobs)
- Include specific program names, organizations, and addresses when creating actions
- Provide clear next steps for how to apply or get more information
- Consider programs that offer comprehensive support (coaching, training, placement)
- For young adults (18-24), prioritize youth-specific programs
- For beneficiaries with immediate basic needs, prioritize 211 services with addresses
`;
  }
}