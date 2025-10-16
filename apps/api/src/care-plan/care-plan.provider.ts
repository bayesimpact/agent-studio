import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration } from '@google/genai';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';

/**
 * Frontend-only provider for displaying a care plan
 * This provider's function calls are executed on the frontend to show the UI
 */
@Injectable()
export class CarePlanProvider implements AIFrontendProvider {
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'display_care_plan',
      description:
        'Display a structured care plan with grouped items (job searches, services, etc.). Use this to show the case manager the action plan.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          planItems: {
            type: Type.ARRAY,
            description: 'Array of high-level care plan items that can be expanded',
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: 'Care plan item ID',
                },
                type: {
                  type: Type.STRING,
                  description: 'Type of item: "job_search" for job searches, "service" for support services',
                },
                title: {
                  type: Type.STRING,
                  description: 'High-level action title (e.g., "Trouver un emploi de développeur", "Aide au logement")',
                },
                description: {
                  type: Type.STRING,
                  description: 'Description in markdown format (used for service items without nested details)',
                },
                location: {
                  type: Type.STRING,
                  description: 'Location',
                },
                contact: {
                  type: Type.STRING,
                  description: 'Contact information (for services)',
                },
                serviceType: {
                  type: Type.STRING,
                  description: 'Service type or thematic (for services)',
                },
                // Nested items for both job searches and services
                items: {
                  type: Type.ARRAY,
                  description: 'Array of detailed items (job offers for job_search, service details for service)',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: {
                        type: Type.STRING,
                        description: 'Item ID',
                      },
                      title: {
                        type: Type.STRING,
                        description: 'Item title (job title or service name)',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Item description (markdown supported)',
                      },
                      location: {
                        type: Type.STRING,
                        description: 'Location',
                      },
                      // Job-specific fields
                      company: {
                        type: Type.STRING,
                        description: 'Company name (for job offers)',
                      },
                      contractType: {
                        type: Type.STRING,
                        description: 'Contract type (for job offers: CDI, CDD, etc.)',
                      },
                      // Service-specific fields
                      contact: {
                        type: Type.STRING,
                        description: 'Contact information (for services)',
                      },
                      serviceType: {
                        type: Type.STRING,
                        description: 'Service type (for services)',
                      },
                    },
                    required: ['id', 'title'],
                  },
                },
              },
              required: ['id', 'type', 'title'],
            },
          },
        },
        required: ['planItems'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Outil: \`display_care_plan\`
**Description**: Affiche un plan d'accompagnement structuré avec des items de haut niveau qui peuvent être dépliés.

**Structure du plan**:
\`\`\`json
{
  "planItems": [
    {
      "id": "emploi-1",
      "type": "job_search",
      "title": "Trouver un emploi de développeur à Paris",
      "location": "Paris",
      "items": [
        {"id": "job-1", "title": "Développeur Full Stack", "company": "TechCorp", "location": "Paris", "contractType": "CDI", "description": "..."},
        {"id": "job-2", "title": "Développeur Backend", "company": "StartupCo", "location": "Paris", "contractType": "CDI", "description": "..."}
      ]
    },
    {
      "id": "logement-1",
      "type": "service",
      "title": "Services d'aide au logement",
      "location": "Paris",
      "items": [
        {"id": "svc-1", "title": "Réduction des impayés de loyer", "description": "# Description\\n\\nCe service...", "contact": "01-23-45-67-89", "serviceType": "Logement"},
        {"id": "svc-2", "title": "Aide à la recherche de logement", "description": "# Description\\n\\n...", "contact": "01-98-76-54-32"}
      ]
    },
    {
      "id": "formation-1",
      "type": "service",
      "title": "Formation professionnelle",
      "description": "# Vue d'ensemble\\n\\nPlusieurs formations disponibles...",
      "location": "Paris",
      "serviceType": "Formation"
    }
  ]
}
\`\`\`

**Types d'items**:
- **\`job_search\`**: Regroupe plusieurs offres d'emploi sous un titre d'action (ex: "Trouver un emploi de développeur")
  - **DOIT** contenir un tableau \`items\` avec 3-10 offres d'emploi sélectionnées
  - Les offres seront affichées quand l'utilisateur déplie l'item

- **\`service\`**: Affiche des services d'accompagnement - **2 modes possibles**:

  **Mode 1 - Avec détails structurés** (plusieurs services similaires):
  - Contient un tableau \`items\` avec 2-10 services détaillés
  - Chaque service a: \`title\`, \`description\` (markdown), \`contact\`, \`serviceType\`
  - Utilisé quand tu as plusieurs services du même type (ex: 3 aides au logement différentes)

  **Mode 2 - Description simple** (service unique):
  - Pas de tableau \`items\`
  - Utilise le champ \`description\` (markdown) au niveau supérieur
  - Ajoute \`serviceType\` et \`contact\` au niveau supérieur
  - Utilisé pour un service unique ou une vue d'ensemble

**Règles d'utilisation**:
- Crée 2-5 items de haut niveau dans le plan d'accompagnement
- Pour les recherches d'emploi, groupe les offres par type de poste ou domaine
- La description des services doit être en markdown et bien formatée
- Ta réponse textuelle doit être **courte** (ex: "Voici le plan d'accompagnement proposé.")
- Ne **JAMAIS** lister les items en texte (l'interface le fait visuellement)
`;
  }
}