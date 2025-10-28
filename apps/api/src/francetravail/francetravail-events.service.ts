import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EventSearchResponse } from './types/event.types';
import { SimplifiedEvent } from './models/simplified-event.model';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { Location } from '../geoloc/models/location.model';
import { FranceTravailBaseService } from './francetravail-base.service';

@Injectable()
export class FranceTravailEventsService
  extends FranceTravailBaseService
  implements AIServiceProvider
{
  constructor() {
    super();
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'events_search',
      description: 'Search for job fairs and employment events (salons emploi, forums métiers, événements de recrutement)',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobTitles: {
            type: Type.ARRAY,
            description: 'possible jobs title in french to find relevant sector events, e.g. boucher or chauffeur de bus',
            items: {
              type: Type.STRING,
            }
          },
          cityName: {
            type: Type.ARRAY,
            description: 'City name in french',
            items: {
              type: Type.STRING,
            }
          },
          endDate: {
            type: Type.STRING,
            description: 'End date for event search in YYYY-MM-DD format (optional)',
          },
        },
        required: ['jobTitles', 'cityName'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`events_search\`
**Description**: Search for job fairs, employment forums, and recruitment events via the France Travail API.

**Parameters**:
- \`jobTitles\`: 2-5 relevant job titles in French to find sector-specific events
  - Examples: ["développeur web", "développeur full stack"], ["chauffeur de bus", "conducteur"]
- \`cityName\`: City name (required - ask if not provided)
- \`endDate\`: Optional end date for the search (format: YYYY-MM-DD)

**Returns**: List of events with id, title, description, dates, location, registration URL, and sector
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{events: SimplifiedEvent[]}> {
    const jobTitles = functionCall.args['jobTitles'] as string[];
    const endDate = functionCall.args['endDate'] as string | undefined;
    const departmentCode = functionCall.args['departmentCode'] as string | undefined;

    console.log('Function calling events with params:', jobTitles, departmentCode, endDate);

    const events = await this.searchEvents({
      jobTitles,
      departmentCode,
      endDate,
    });
    console.log('Events found: ', events.length);
    return { events };
  }

  async searchEvents({
    jobTitles,
    departmentCode,
    endDate,
  }: {
    jobTitles: string[];
    departmentCode: string;
    endDate?: string;
  }): Promise<SimplifiedEvent[]> {
    const accessToken = await this.getAccessToken();
    const romeCodes = await this.getROMECodes({ jobTitles });
    const secteurActivites = this.extractSecteurActivite(romeCodes);

    console.log(`Calling events search with sectors ${secteurActivites.join(',')} in department ${departmentCode}`);

    // Create request body
    const requestBody: any = {
      departements: [departmentCode],
    };

    if (endDate) {
      requestBody.dateFin = endDate;
    }

    // Make separate requests for each sector and combine results
    const allEvents: SimplifiedEvent[] = [];

    for (const secteur of secteurActivites) {
      try {
        const { data } = await axios.post<EventSearchResponse>(
          'https://api.francetravail.io/partenaire/evenements/v1/mee/evenements',
          {
            ...requestBody,
            secteurActivite: secteur,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (data.content && data.content.length > 0) {
          allEvents.push(...SimplifiedEvent.fromEvents(data.content));
        }
      } catch (error) {
        console.error(`Error fetching events for sector ${secteur}:`, error);
        // Continue with other sectors even if one fails
      }
    }

    // Remove duplicates based on event ID
    const uniqueEvents = allEvents.filter(
      (event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
    );

    return uniqueEvents.slice(0, 20); // Limit to 20 results
  }
}