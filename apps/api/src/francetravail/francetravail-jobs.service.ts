import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JobSearchResponse } from './types/job-offer.types';
import { SimplifiedJobOffer } from './models/simplified-job-offer.model';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { FranceTravailBaseService } from './francetravail-base.service';

@Injectable()
export class FranceTravailJobsService
  extends FranceTravailBaseService
  implements AIServiceProvider
{
  constructor() {
    super();
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'jobs_search',
      description: 'Search for a job, you can automatically propose job titles based on the context you have',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobTitles: {
            type: Type.ARRAY,
            description: 'possible jobs title in french, e.g. boucher or chauffeur de bus',
            items: {
              type: Type.STRING,
            }
          },
          cityName: {
            type: Type.STRING,
            description: 'City name in french',
          },
        },
        required: ['jobTitles', 'cityName'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`jobs_search\`
**Description**: Search for job offers via the France Travail API.

**Parameters**:
- \`jobTitles\`: 2-5 relevant job titles in French
  - Examples: ["développeur web", "développeur full stack"], ["chauffeur de bus", "conducteur"]
- \`cityName\`: City name (required - ask if not provided)

**Returns**: List of offers with id, title, company, location, contract type, description (up to 20 results)
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{jobOffers: SimplifiedJobOffer[]}> {
    const jobTitles = functionCall.args['jobTitles'] as string[];
    const departmentsCode = functionCall.args['departmentsCode'] as string[];
    console.log('Function calling with params:', jobTitles, departmentsCode);

    const jobOffers = await this.searchJobOffers({
      jobTitles,
      departmentsCode,
    });
    console.log('Job offers length: ', jobOffers.length);
    return { jobOffers };
  }

  async searchJobOffers({
    jobTitles,
    departmentsCode
  }: {
    jobTitles: string[];
    departmentsCode: string[];
  }): Promise<SimplifiedJobOffer[]> {
    const accessToken = await this.getAccessToken();
    const romeCodes = await this.getROMECodes({ jobTitles });
    const codeROME = romeCodes.join(',');
    const departement = departmentsCode.join(',');
    console.log(`Calling job search with ${codeROME} ${departement}`);

    const { data } = await axios.get<JobSearchResponse>(
      'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?range=0-20',
      {
        params: {
          codeROME,
          departement,
        },
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Handle empty or null results
    if (!data.resultats || data.resultats.length === 0) {
      console.log('No job offers found');
      return [];
    }

    return SimplifiedJobOffer.fromJobOffers(data.resultats);
  }
}