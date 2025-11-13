import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SimplifiedWorkshop } from './models/simplified-workshop.model';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';

@Injectable()
export class NotionWorkshopService implements AIServiceProvider {
  private readonly notionApiUrl =
    process.env.NOTION_API_URL || 'https://api.notion.com/v1';
  private readonly notionSecret = process.env.NOTION_SECRET;
  private readonly notionFrDatabaseId =
    process.env.NOTION_FR_DATABASE_ID || 'e3b5ba04a6b94e6a845c604ae46bcee6';
  private readonly notionUsDatabaseId =
    process.env.NOTION_US_DATABASE_ID || '2a37d19cc82581569dbde2244d994d84';

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'workshops_search',
      description:
        'Search for workshops, training sessions, and professional events (ateliers, formations, événements professionnels)',
      parameters: {
        type: Type.OBJECT,
        properties: {
          cityName: {
            type: Type.ARRAY,
            description: 'City name in French',
            items: {
              type: Type.STRING,
            },
          },
          country: {
            type: Type.STRING,
            description: 'Country code fr or us, provided inside the prompt',
          },
        },
        required: ['cityName', 'country'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`workshops_search\`
**Description**: Search for workshops, training sessions, and professional events from Notion database.

**Parameters**:
- \`cityName\`: City name (required)
- \`country\`: us or fr provided by the prompt

**Returns**: List of workshops with title, date, location, capacity, signup URL, type, and description
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{ workshops: SimplifiedWorkshop[] }> {
    const workshopTypes = functionCall.args['workshopTypes'] as string[];
    const startDate = functionCall.args['startDate'] as string | undefined;
    const country = functionCall.args['country'] as 'us' | 'fr';

    console.log(
      'Function calling workshops with params:',
      workshopTypes,
      startDate,
    );

    const workshops = await this.searchWorkshops(country);
    console.log('Workshops found: ', workshops.length);
    return { workshops };
  }

  async searchWorkshops(country: 'us' | 'fr'): Promise<SimplifiedWorkshop[]> {
    if (!this.notionSecret) {
      console.error('NOTION_SECRET is not configured');
      return [];
    }

    try {
      console.log(`Calling workshops search (returning all items)`);

      // Simple query body - no filters for first version, just return all items
      const queryBody = {
        page_size: 100,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending',
          },
        ],
      };
      const notionDatabaseId =
        country === 'us' ? this.notionUsDatabaseId : this.notionFrDatabaseId;
      const { data } = await axios.post<any>(
        `${this.notionApiUrl}/databases/${notionDatabaseId}/query`,
        queryBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.notionSecret}`,
            'Notion-Version': '2022-06-28',
          },
        },
      );

      // Parse Notion API response
      if (!data.results || data.results.length === 0) {
        console.log('No workshops found in database');
        return [];
      }

      console.log(`Found ${data.results.length} workshops in Notion database`);

      // Transform Notion pages to workshops
      const workshops = this.parseNotionPages(data.results);
      return SimplifiedWorkshop.fromWorkshops(workshops);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Notion API error:',
          error.response?.status,
          error.response?.data,
        );
      } else {
        console.error('Error fetching workshops:', error);
      }
      return [];
    }
  }

  private parseNotionPages(pages: any[]): any[] {
    return pages.map((page) => {
      const properties = page.properties;

      // Helper to get property values from Notion's complex structure
      const getTitle = (prop: any) => prop?.title?.[0]?.plain_text || '';
      const getRichText = (prop: any) => prop?.rich_text?.[0]?.plain_text || '';
      const getSelect = (prop: any) => prop?.select?.name || '';
      const getStatus = (prop: any) => prop?.status?.name || '';
      const getDate = (prop: any) => prop?.date?.start || null;
      const getNumber = (prop: any) => prop?.number || 0;
      const getUrl = (prop: any) => prop?.url || '';

      // Based on actual Notion response structure
      const title = getTitle(properties['Intitulé de la session']);
      const atelierName = getRichText(properties['Atelier (nom)']);
      const date = getDate(properties['Date']);
      const capacity = getNumber(properties['Capacité']);
      const signupUrl = getUrl(properties["Lien d'inscription"]);
      const status = getStatus(properties['Statut']);
      const type = getSelect(properties['Type']);
      const locationText = getRichText(properties['Lieu']);
      const organizer = getRichText(properties['Organisateur']);
      const description = getRichText(properties['Description (atelier)']);

      return {
        id: page.id,
        title: title || atelierName,
        date: {
          start: date,
          end: null,
          is_datetime: false,
        },
        capacity: capacity,
        signup_url: signupUrl,
        status: status,
        atelier_name: atelierName,
        type: type,
        location_text: locationText,
        location_place: {
          name: locationText,
          address: locationText,
          latitude: 0,
          longitude: 0,
          google_place_id: '',
        },
        organizer: organizer,
        atelier_description: description,
      };
    });
  }
}
