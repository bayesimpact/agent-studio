import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JobSearchResponse } from './types/job-offer.types';
import { SimplifiedJobOffer } from './models/simplified-job-offer.model';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { Location } from '../geoloc/models/location.model';

@Injectable()
export class FranceTravailService implements AIServiceProvider {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  private clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  private secretKey = process.env.FRANCE_TRAVAIL_SECRET_KEY;

  constructor() {}

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
            type: Type.ARRAY,
            description: 'City name in french',
            items: {
              type: Type.STRING,
            }
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

  private async getAccessToken(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.secretKey,
      scope: 'api_romeov2 o2dsoffre api_offresdemploiv2 api_evenementsv1 evenements',
    });

    const { data } = await axios.post(
      'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return data.access_token;
  }

  private async getROMECodes({
    jobTitles,
  }: {
    jobTitles: string[];
  }): Promise<string[]> {
    const accessToken = await this.getAccessToken();

    const appellations = jobTitles.map((title, index) => ({
      intitule: title,
      identifiant: `id${index + 1}`,
    }));

    const { data } = await axios.post(
      'https://api.francetravail.io/partenaire/romeo/v2/predictionMetiers',
      {
        appellations,
        options: {
          nomAppelant: 'caseai',
          nbResultats: 5,
          seuilScorePrediction: 0.7,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Extract ROME codes from the response
    const romeCodes: string[] = [];
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.metiersRome) {
          item.metiersRome.forEach((metier: any) => {
            if (metier.codeRome && !romeCodes.includes(metier.codeRome)) {
              romeCodes.push(metier.codeRome);
            }
          });
        }
      });
    }

    return romeCodes;
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

    return SimplifiedJobOffer.fromJobOffers(data.resultats);
  }
}
