import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration } from '@google/genai';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';

/**
 * Frontend-only provider for displaying a filtered job list
 * This provider's function calls are executed on the frontend to show the UI
 */
@Injectable()
export class JobListProvider implements AIFrontendProvider {
  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'joblist_display',
      description:
        'Display a filtered list of job offers that you have selected from the jobs_search results. Use this to show the most relevant jobs to the user.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          jobs: {
            type: Type.ARRAY,
            description: 'Array of simplified job offers from the jobs_search results that you want to display',
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: 'Job offer ID',
                },
                title: {
                  type: Type.STRING,
                  description: 'Job title',
                },
                company: {
                  type: Type.STRING,
                  description: 'Company name',
                },
                location: {
                  type: Type.STRING,
                  description: 'Job location',
                },
                contractType: {
                  type: Type.STRING,
                  description: 'Contract type (CDI, CDD, etc.)',
                },
                description: {
                  type: Type.STRING,
                  description: 'Job description',
                },
              },
              required: ['id', 'title', 'company', 'location'],
            },
          },
        },
        required: ['jobs'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Outil: \`joblist_display\`
**Description**: Utilise cet outil pour afficher une liste filtrée d'offres d'emploi que tu as sélectionnées depuis les résultats de \`jobs_search\`. Cet outil est exécuté côté frontend uniquement.

**Règles spécifiques**:
- Utilise cet outil **APRÈS** avoir appelé \`jobs_search\` et analysé les résultats.
- Tu **DOIS** sélectionner les offres les plus pertinentes pour le bénéficiaire (maximum 5-10 offres).
- Le paramètre \`jobs\` contient les objets complets des offres simplifiées que tu veux afficher.
- Cet outil ne fait **PAS** d'appel API backend - il met simplement à jour l'interface utilisateur pour afficher la liste filtrée.

**Exemples**:
- **Exemple après recherche**:
  1. Tu appelles: \`jobs_search(jobTitles=["développeur"], cityName=["Paris"])\`
  2. Tu reçois 20 résultats
  3. Tu analyses et sélectionnes les 5 plus pertinents
  4. Tu appelles: \`joblist_display(jobs=[{id: "123", title: "Développeur Full Stack", company: "Google", location: "Paris", contractType: "CDI", description: "..."}, ...])\`
  5. Tu expliques: "J'ai sélectionné 5 offres particulièrement intéressantes pour ce profil."

- **Exemple avec justification**:
  Gestionnaire: "Trouve des offres de chauffeur de bus à Lyon."
  1. Appel: \`jobs_search(jobTitles=["chauffeur de bus"], cityName=["Lyon"])\`
  2. Analyse des résultats
  3. Appel: \`joblist_display(jobs=[{id: "567", title: "Chauffeur de bus H/F", company: "TCL", location: "Lyon", contractType: "CDI", description: "..."}, ...])\`
  4. Toi: "Voici 3 offres de chauffeur de bus à Lyon qui correspondent bien au profil : deux en CDI et une en CDD pour commencer."
`;
  }
}