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
        'Display the collected profile parameters to the beneficiary. Call this PROGRESSIVELY as soon as you collect ANY information, even partial data. Update it every time you get new information.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          mandatory: {
            type: Type.OBJECT,
            description: 'Mandatory parameters that were collected (can be partial)',
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
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`display_profile\`
**Description**: Display the collected profile parameters to the beneficiary as a summary card.

**CRITICAL: Call this PROGRESSIVELY as information is collected**
- Call it as soon as you have cityName OR primaryCategory (even just one field)
- Update it every time you collect new information
- Don't wait for all mandatory fields - show partial data immediately
- The profile panel will update progressively as the user provides information

**When to use**:
- Immediately after collecting cityName (first piece of info)
- After collecting primaryCategory (second piece of info)
- After collecting category-specific details
- After collecting any optional information
- Basically: call it after EVERY user response that provides data

**Example progressive flow**:
1. User: "Paris" → IMMEDIATELY call display_profile with {"mandatory": {"cityName": "Paris"}}
2. User: "Emploi" → IMMEDIATELY call display_profile with {"mandatory": {"cityName": "Paris", "primaryCategory": "emploi"}}
3. User: "Développeur" → IMMEDIATELY call display_profile with full data including desiredJobs

**Usage rules**:
- Call with PARTIAL data - don't wait for everything
- Include only what was collected (don't invent missing fields)
- NO confirmation needed - just display and continue
- After calling this with complete mandatory+category-specific data, proceed to search
`;
  }
}