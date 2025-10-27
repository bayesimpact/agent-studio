import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration } from '@google/genai';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';

/**
 * Frontend provider for displaying the job seeker's profile/parameters
 * The LLM calls this after collecting parameters to show the user what information was gathered
 */
@Injectable()
export class ProfileDisplayProvider implements AIFrontendProvider {
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'display_profile',
      description:
        'Display the collected profile parameters to the beneficiary. Use this after gathering minimum required information and before searching for jobs/services.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          mandatory: {
            type: Type.OBJECT,
            description: 'Mandatory parameters that were collected',
            properties: {
              cityName: {
                type: Type.STRING,
                description: 'The city or commune where the person lives',
              },
              primaryCategory: {
                type: Type.STRING,
                description: 'Main category of need',
                enum: [
                  'emploi',
                  'projet-pro',
                  'sport-loisirs',
                  'citoyennete',
                  'formation',
                  'logement',
                  'sante',
                ],
              },
            },
            required: ['cityName', 'primaryCategory'],
          },
          categorySpecific: {
            type: Type.OBJECT,
            description: 'Category-specific parameters',
            properties: {
              // EMPLOI
              desiredJobs: {
                type: Type.ARRAY,
                description: 'Desired job titles (for EMPLOI category)',
                items: {
                  type: Type.STRING,
                },
              },
              // PROJET PRO
              projectType: {
                type: Type.STRING,
                description: 'Type of professional project (for PROJET PRO category)',
                enum: ['stage', 'formation', 'alternance', 'enquete-metier'],
              },
              // SPORT ET LOISIRS
              activityTypes: {
                type: Type.ARRAY,
                description: 'Types of activities (for SPORT ET LOISIRS category)',
                items: {
                  type: Type.STRING,
                  enum: ['sport', 'cinema', 'exposition', 'spectacle', 'creative', 'autre'],
                },
              },
              // CITOYENNETE
              needTypes: {
                type: Type.ARRAY,
                description: 'Types of civic needs (for CITOYENNETE category)',
                items: {
                  type: Type.STRING,
                  enum: ['permis', 'demarches-admin', 'allocations', 'benevolat', 'autre'],
                },
              },
              // FORMATION
              formationType: {
                type: Type.STRING,
                description: 'Type of training (for FORMATION category)',
                enum: ['professionnelle', 'apprentissage', 'atelier', 'subvention'],
              },
              // LOGEMENT
              housingNeed: {
                type: Type.STRING,
                description: 'Housing need (for LOGEMENT category)',
                enum: ['recherche', 'dossier', 'visite', 'achat', 'aide', 'autre'],
              },
              // SANTE
              healthNeeds: {
                type: Type.ARRAY,
                description: 'Health needs (for SANTE category)',
                items: {
                  type: Type.STRING,
                  enum: [
                    'medical-rdv',
                    'bilan',
                    'carte-vitale',
                    'demarche',
                    'hospitalisation',
                    'reeducation',
                    'autre',
                  ],
                },
              },
            },
          },
          optional: {
            type: Type.OBJECT,
            description: 'Optional parameters that were collected',
            properties: {
              age: {
                type: Type.NUMBER,
                description: 'Age of the person',
              },
              educationLevel: {
                type: Type.STRING,
                description: 'Highest education level',
                enum: ['sans-diplome', 'cap-bep', 'bac', 'bac+2', 'bac+3', 'bac+5-plus'],
              },
              experienceLevel: {
                type: Type.STRING,
                description: 'Professional experience level',
                enum: ['debutant', '1-3ans', '3-5ans', '5ans+'],
              },
              contractTypes: {
                type: Type.ARRAY,
                description: 'Preferred contract types',
                items: {
                  type: Type.STRING,
                  enum: ['CDI', 'CDD', 'interim', 'alternance'],
                },
              },
              hasVehicle: {
                type: Type.BOOLEAN,
                description: 'Whether the person has a vehicle',
              },
              hasDriversLicense: {
                type: Type.BOOLEAN,
                description: 'Whether the person has a driver\'s license',
              },
              hasDisability: {
                type: Type.BOOLEAN,
                description: 'Whether the person has a disability (for accessibility)',
              },
              financialDifficulties: {
                type: Type.BOOLEAN,
                description: 'Whether the person has financial difficulties',
              },
            },
          },
        },
        required: ['mandatory'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`display_profile\`
**Description**: Display the collected profile parameters to the beneficiary as a summary card.

**When to use**:
- After collecting the minimum required parameters (cityName + primaryCategory + category-specific)
- Before starting to search for jobs/services
- To confirm with the user that the information is correct

**Profile structure**:
\`\`\`json
{
  "mandatory": {
    "cityName": "Lyon",
    "primaryCategory": "emploi"
  },
  "categorySpecific": {
    "desiredJobs": ["cuisinier", "chef de cuisine"]
  },
  "optional": {
    "contractTypes": ["CDI"],
    "experienceLevel": "3-5ans"
  }
}
\`\`\`

**Usage rules**:
- Call this AFTER collecting minimum required parameters
- Call this BEFORE calling any search tools (jobs_search, services_search, events_search)
- Include all parameters that were collected (don't invent or guess missing ones)
- Use this to confirm information with the beneficiary
- After calling this, ask if the information is correct or if they want to modify anything

**Example flow**:
1. Collect cityName → "Lyon"
2. Collect primaryCategory → "emploi"
3. Collect desiredJobs → ["cuisinier", "chef de cuisine"]
4. Call \`display_profile\` with collected data
5. Show message: "Voici le profil que j'ai créé pour vous. Est-ce que tout est correct ?"
6. If confirmed, proceed to search for jobs/services
`;
  }
}