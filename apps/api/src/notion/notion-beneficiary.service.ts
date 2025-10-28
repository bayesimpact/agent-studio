import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { Location } from '../geoloc/models/location.model';

@Injectable()
export class NotionBeneficiaryService implements AIServiceProvider {
  private readonly notionApiUrl = process.env.NOTION_API_URL || 'https://api.notion.com/v1';
  private readonly notionSecret = process.env.NOTION_SECRET;
  private readonly beneficiaryDatabaseId = process.env.NOTION_BENEFICIARY_DATABASE_ID || '29a7d19cc825808baa2dce8093f0dd59';

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'fetch_beneficiary_profile',
      description: 'Fetch a beneficiary profile from Notion database by name. Use this when the user writes @trinity followed by a name (e.g., "@trinity Melvin")',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Name of the beneficiary to search for (extracted from the @trinity mention)',
          },
        },
        required: ['name'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`fetch_beneficiary_profile\`
**Description**: Fetch a beneficiary (job seeker) profile from the Notion database.

**IMPORTANT**: This function should be called automatically when the user mentions a beneficiary using the @trinity syntax.

**Trigger Pattern**: When you see "@trinity <Name>" in the user's message (e.g., "@trinity Melvin", "@trinity Jean Dupont"),
you MUST immediately call this function with the name that follows @trinity.

**Parameters**:
- \`name\`: Name of the beneficiary extracted from the @trinity mention (e.g., if user writes "@trinity Melvin", use "Melvin")

**Returns**: Profile information as a formatted string

**Example Usage**:
- User writes: "@trinity Melvin"
- You call: fetch_beneficiary_profile(name="Melvin")
- Then you present the profile information to the user in a natural way
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
    locations: Location[],
  ): Promise<{ profile: string }> {
    const name = functionCall.args['name'] as string;

    console.log('Fetching beneficiary profile for:', name);

    const profile = await this.fetchBeneficiaryProfile(name);
    return { profile };
  }

  async fetchBeneficiaryProfile(name: string): Promise<string> {
    if (!this.notionSecret) {
      console.error('NOTION_SECRET is not configured');
      return 'Error: Notion API key not configured';
    }

    if (!this.beneficiaryDatabaseId) {
      console.error('NOTION_BENEFICIARY_DATABASE_ID is not configured');
      return 'Error: Beneficiary database ID not configured';
    }

    try {
      console.log(`Searching for beneficiary: ${name}`);

      const queryBody = {
        filter: {
          property: 'Name',
          title: { contains: name },
        },
      };

      const { data } = await axios.post<any>(
        `${this.notionApiUrl}/databases/${this.beneficiaryDatabaseId}/query`,
        queryBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.notionSecret}`,
            'Notion-Version': '2022-06-28',
          },
        },
      );

      if (!data.results || data.results.length === 0) {
        console.log('No beneficiary found with that name');
        return `No beneficiary profile found for: ${name}`;
      }

      console.log(`Found ${data.results.length} beneficiary profile(s)`);

      // Convert the first result to a readable string
      const profile = this.formatProfileAsString(data.results[0]);
      return profile;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Notion API error:', error.response?.status, error.response?.data);
        return `Error fetching profile: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`;
      } else {
        console.error('Error fetching beneficiary profile:', error);
        return `Error fetching profile: ${error}`;
      }
    }
  }

  private formatProfileAsString(page: any): string {
    const properties = page.properties;

    // Helper functions to extract values from Notion's structure
    const getTitle = (prop: any) => prop?.title?.[0]?.plain_text || 'N/A';
    const getRichText = (prop: any) => prop?.rich_text?.[0]?.plain_text || 'N/A';
    const getSelect = (prop: any) => prop?.select?.name || 'N/A';
    const getMultiSelect = (prop: any) => prop?.multi_select?.map((item: any) => item.name).join(', ') || 'N/A';
    const getEmail = (prop: any) => prop?.email || 'N/A';
    const getPhone = (prop: any) => prop?.phone_number || 'N/A';
    const getDate = (prop: any) => prop?.date?.start || 'N/A';
    const getNumber = (prop: any) => prop?.number?.toString() || 'N/A';

    // Build a formatted string with all available properties
    let profileString = `Beneficiary Profile\n`;
    profileString += `==================\n\n`;

    // Iterate through all properties and format them
    for (const [key, value] of Object.entries(properties)) {
      const prop = value as any;
      let formattedValue = 'N/A';

      switch (prop.type) {
        case 'title':
          formattedValue = getTitle(prop);
          break;
        case 'rich_text':
          formattedValue = getRichText(prop);
          break;
        case 'select':
          formattedValue = getSelect(prop);
          break;
        case 'multi_select':
          formattedValue = getMultiSelect(prop);
          break;
        case 'email':
          formattedValue = getEmail(prop);
          break;
        case 'phone_number':
          formattedValue = getPhone(prop);
          break;
        case 'date':
          formattedValue = getDate(prop);
          break;
        case 'number':
          formattedValue = getNumber(prop);
          break;
        default:
          formattedValue = JSON.stringify(prop);
      }

      if (formattedValue !== 'N/A' && formattedValue !== '') {
        profileString += `${key}: ${formattedValue}\n`;
      }
    }

    return profileString;
  }
}