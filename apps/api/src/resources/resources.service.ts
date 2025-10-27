import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { Location } from '../geoloc/models/location.model';
import { FranceTravailJobsService } from '../francetravail/francetravail-jobs.service';
import { FranceTravailEventsService } from '../francetravail/francetravail-events.service';
import {
  DataInclusionService,
  thematiques,
} from '../datainclusion/datainclusion.service';

@Injectable()
export class ResourcesService implements AIServiceProvider {
  constructor(
    private franceTravailJobsService: FranceTravailJobsService,
    private franceTravailEventsService: FranceTravailEventsService,
    private dataInclusionService: DataInclusionService,
  ) {}

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'search_resources',
      description:
        'Unified resource search (job offers, employment events, or support services) based on the beneficiary\'s needs.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          provider: {
            type: Type.STRING,
            description: 'Type of resources to search',
            enum: ['jobs', 'events', 'services'],
          },
          cityName: {
            type: Type.ARRAY,
            description: 'City name in French (required)',
            items: {
              type: Type.STRING,
            },
          },
          // For jobs and events providers
          jobTitles: {
            type: Type.ARRAY,
            description: 'Job titles sought in French (required if provider="jobs" or provider="events")',
            items: {
              type: Type.STRING,
            },
          },
          // For events provider
          endDate: {
            type: Type.STRING,
            description: 'End date for event search in YYYY-MM-DD format (optional, only for events)',
          },
          // For services provider
          thematiques: {
            type: Type.ARRAY,
            description: 'Service themes (required if provider="services")',
            items: {
              type: Type.STRING,
              enum: thematiques,
            },
          },
        },
        required: ['provider', 'cityName'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`search_resources\`
**Description**: Unified resource search - job offers, employment events, OR social services.

**Parameters**:
- \`provider\`: Search type
  - \`"jobs"\`: Search job offers via France Travail
  - \`"events"\`: Search employment events (job fairs, forums) via France Travail
  - \`"services"\`: Search support services via Data Inclusion
- \`cityName\`: City name (required - ask if not provided)

**If provider="jobs"**:
- \`jobTitles\`: 2-5 relevant job titles in French
  - Examples: ["développeur web", "développeur full stack"], ["chauffeur de bus", "conducteur"]

**If provider="events"**:
- \`jobTitles\`: 2-5 relevant job titles in French (to find sector-specific events)
  - Examples: ["développeur web", "développeur full stack"], ["chauffeur de bus", "conducteur"]
- \`endDate\`: Optional end date in YYYY-MM-DD format

**If provider="services"**:
- \`thematiques\`: List of exact themes from the available enum
  - You can select multiple themes if the situation is complex
  - Examples: ["logement-hebergement--reduire-les-impayes-de-loyer"], ["preparer-sa-candidature--realiser-un-cv-et-ou-une-lettre-de-motivation", "trouver-un-emploi--convaincre-un-recruteur-en-entretien"]

**Returns**:
- For jobs: List of offers with id, title, company, location, contract type, description (up to 20 results)
- For events: List of events with id, title, description, dates, location, registration URL, sector (up to 20 results)
- For services: List of services with id, name, description, location, service type, contact (up to 20 results)
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
    locations: Location[],
  ): Promise<any> {
    const provider = functionCall.args['provider'] as string;

    if (provider === 'jobs') {
      const jobTitles = functionCall.args['jobTitles'] as string[];
      if (!jobTitles || jobTitles.length === 0) {
        throw new Error('jobTitles is required when provider is "jobs"');
      }
      return await this.franceTravailJobsService.executeFunction(
        {
          ...functionCall,
          name: 'jobs_search',
          args: { jobTitles, cityName: functionCall.args['cityName'] },
        },
        locations,
      );
    } else if (provider === 'events') {
      const jobTitles = functionCall.args['jobTitles'] as string[];
      if (!jobTitles || jobTitles.length === 0) {
        throw new Error('jobTitles is required when provider is "events"');
      }
      const endDate = functionCall.args['endDate'] as string | undefined;
      return await this.franceTravailEventsService.executeFunction(
        {
          ...functionCall,
          name: 'events_search',
          args: {
            jobTitles,
            cityName: functionCall.args['cityName'],
            ...(endDate && { endDate }),
          },
        },
        locations,
      );
    } else if (provider === 'services') {
      const thematiques = functionCall.args['thematiques'] as string[];
      if (!thematiques || thematiques.length === 0) {
        throw new Error('thematiques is required when provider is "services"');
      }
      return await this.dataInclusionService.executeFunction(
        {
          ...functionCall,
          name: 'services_search',
          args: { thematiques, cityName: functionCall.args['cityName'] },
        },
        locations,
      );
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }
}