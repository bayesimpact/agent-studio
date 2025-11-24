import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LaBonneBoiteResponse } from './types/labonneboite.types';
import { SimplifiedCompany } from './models/simplified-company.model';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { FranceTravailBaseService } from './francetravail-base.service';
import qs from 'qs';

@Injectable()
export class FranceTravailLaBonneBoiteService
  extends FranceTravailBaseService
  implements AIServiceProvider
{
  constructor() {
    super();
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'companies_search',
      description:
        'Search for companies that are hiring (La Bonne Boite). Use this to find companies with high hiring potential based on job titles and location.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobTitles: {
            type: Type.ARRAY,
            description:
              'Relevant job titles in French to find companies hiring for these positions (e.g., "développeur web", "cuisinier")',
            items: {
              type: Type.STRING,
            },
          },
          cityName: {
            type: Type.STRING,
            description: 'City name in French (required)',
          },
        },
        required: ['jobTitles', 'cityName'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`companies_search\`
**Description**: Search for companies with high hiring potential via La Bonne Boite (France Travail).

**Parameters**:
- \`jobTitles\`: 2-5 relevant job titles in French
  - Examples: ["développeur web", "développeur full stack"], ["cuisinier", "chef de cuisine"]
- \`cityName\`: City name (required - ask if not provided)

**Returns**: List of companies with:
- Company name and location
- Hiring potential score
- Industry sector (NAF)
- Company size
- Contact availability (email)

**When to use**:
- When the beneficiary wants to do prospection or spontaneous applications
- To find companies that are actively hiring in a specific sector
- To get a list of potential employers in a given area
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{ companies: SimplifiedCompany[] }> {
    const jobTitles = functionCall.args['jobTitles'] as string[];
    const cityName = functionCall.args['cityName'] as string;

    console.log('La Bonne Boite search with params:', { jobTitles, cityName });

    const companies = await this.searchCompanies({
      jobTitles,
      cityName,
    });

    console.log('Companies found:', companies.length);
    return { companies };
  }

  formatResultsForPrompt(result: { companies: SimplifiedCompany[] }): string {
    const { companies } = result;

    if (!companies || companies.length === 0) {
      return `**Entreprises (La Bonne Boite)**: Aucune entreprise trouvée pour candidatures spontanées.`;
    }

    const summary = `**Entreprises à fort potentiel d'embauche - La Bonne Boite** (${companies.length} résultats):

Ces entreprises ont un fort potentiel d'embauche et sont idéales pour des **candidatures spontanées**.

Si le profil est en recherche d'emploi, les candidatures spontanées sont souvent au moins aussi efficace que de postuler.
Dans la mesure du possible il est intéressant d'en ajouter dans les plans d'action. 

${companies.map((company, index) => {
  const displayName = company.officeName
    ? `${company.name} (${company.officeName})`
    : company.name;

  return `${index + 1}. **${displayName}**
   - Secteur: ${company.nafLabel}
   - Lieu: ${company.city}, ${company.postcode} (${company.department})
   - Potentiel d'embauche: ${company.hiringPotential}/100 ${company.isHighPotential ? '⭐ FORT POTENTIEL' : ''}
   - Taille: ${company.headcountRange}
   - Contact email: ${company.hasEmail ? '✓ Disponible' : '✗ Non disponible'}`;
}).join('\n\n')}`

    return summary;
  }

  async searchCompanies({
    jobTitles,
    cityName,
  }: {
    jobTitles: string[];
    cityName: string;
  }): Promise<SimplifiedCompany[]> {
    const accessToken = await this.getAccessToken();
    const romeCodes = await this.getROMECodes({ jobTitles });

    console.log(
      `Calling La Bonne Boite with city: ${cityName}, ROME codes: ${romeCodes.join(', ')}`,
    );

    // Build query parameters
    const params: any = {
      city: cityName.toLowerCase(),
      page_size: 20,
      sort_by: 'hiring_potential',
      sort_direction: 'desc',
    };

    // Add ROME codes as separate rome parameters
    romeCodes.forEach((code) => {
      if (!params.rome) {
        params.rome = [];
      }
      params.rome.push(code);
    });

    try {
      const { data } = await axios.get<LaBonneBoiteResponse>(
        'https://api.francetravail.io/partenaire/labonneboite/v2/recherche',
        {
          params,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          paramsSerializer: (params) => {
            // Use qs to stringify the params
            // arrayFormat: 'repeat' ensures that arrays are formatted as key=1&key=2
            return qs.stringify(params, { arrayFormat: 'repeat' });
          },
        },
      );

      // Handle empty or null results
      if (!data.items || data.items.length === 0) {
        console.log('No companies found');
        return [];
      }

      console.log(`Found ${data.hits} companies, returning ${data.items.length}`);
      return SimplifiedCompany.fromCompanies(data.items);
    } catch (error) {
      console.error('Error calling La Bonne Boite API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      return []
    }
  }
}