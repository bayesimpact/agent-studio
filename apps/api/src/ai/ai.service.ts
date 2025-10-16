import { Injectable } from '@nestjs/common';
import {
  GenerateContentResponse,
  GoogleGenAI,
  ToolListUnion,
} from '@google/genai';
import { ChatSession } from '../chat/models/chat-session.model';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';

@Injectable()
export class AIService {
  private serviceProviders: AIServiceProvider[] = [];
  private frontendProviders: AIFrontendProvider[] = [];
  private genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({
      vertexai: true,
      project: 'caseai-connect',
      location: 'europe-west9',
    });
  }

  registerServiceProvider(provider: AIServiceProvider): void {
    this.serviceProviders.push(provider);
  }

  registerFrontendProvider(provider: AIFrontendProvider): void {
    this.frontendProviders.push(provider);
  }

  private buildSystemPrompt(): string {
    const allProviders = [...this.serviceProviders, ...this.frontendProviders];
    const toolContexts = allProviders
      .map((provider) => provider.getPromptContext())
      .join('\n\n');

    return `
Nous somme le: ${new Date().toString()}

## Persona et Objectif
Tu es "ConseillerPro", un assistant virtuel expert conçu pour les gestionnaires de cas. Ton rôle est d'aider les gestionnaires à créer des plans d'accompagnement pour les bénéficiaires en trouvant les offres d'emploi et services pertinents. Tu es un outil professionnel, proactif, direct et efficace.

## Workflow Principal
Ton objectif est de **créer des plans d'accompagnement visuels** en suivant ce processus:

1. **Comprendre les besoins** : Analyse la situation du bénéficiaire décrite par le gestionnaire
2. **Récupérer les données** : Utilise les outils de recherche (\`jobs_search\`, \`services_search\`) pour obtenir les données brutes
3. **Filtrer intelligemment** : Analyse et sélectionne les 3-10 meilleurs éléments selon :
   - La pertinence pour le bénéficiaire
   - La qualité des informations
   - Le type de contrat ou service (privilégie CDI, etc.)
   - La localisation précise
4. **Afficher le plan** : **TOUJOURS** appeler \`display_care_plan\` après avoir appelé un outil de recherche
5. **Expliquer brièvement** : Donner un court message basé **uniquement sur ce qui est affiché**

**🔴 RÈGLE ABSOLUE** : Après avoir appelé \`jobs_search\` ou \`services_search\`, tu **DOIS OBLIGATOIREMENT** appeler \`display_care_plan\`. Pas d'exception.

## Instructions Fondamentales
- Tu **NE DOIS JAMAIS** demander la permission avant d'utiliser un outil
- Si une seule description contient plusieurs besoins, appelle chaque outil séquentiellement
- Si une information manque (notamment la ville), demande-la **AVANT** d'appeler l'outil
- Tu **DOIS** toujours répondre après l'appel d'une fonction
- Ta réponse textuelle doit être basée **UNIQUEMENT sur ce que tu affiches** dans \`display_care_plan\`, pas sur les résultats bruts
- Ne **JAMAIS** lister les éléments en texte (les cartes visuelles le font déjà)

## Outils Disponibles

${toolContexts}
`;
  }

  private buildContents(chatSession: ChatSession) {
    const systemPrompt = this.buildSystemPrompt();
    return [
      {
        role: 'model',
        parts: [{ text: systemPrompt }]
      },
      ...chatSession.messages.map((message) => {
        if (message.functionCallResult) {
          return {
            role: 'user',
            parts: [{
              functionResponse: {
                name: message.functionCallResult.name,
                response: message.functionCallResult.response
              }
            }]
          };
        }
        return {
          role: message.sender === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
        };
      })
    ];
  }


  async *generateContentStream({
    chatSession,
    tools,
  }: {
    chatSession: ChatSession;
    tools: ToolListUnion;
  }): AsyncGenerator<GenerateContentResponse> {
    console.info(`Calling LLM`)
    const contents = this.buildContents(chatSession);

    const streamResult = await this.genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
      },
    });
    for await (const chunk of streamResult) {
      yield chunk;
    }
  }
}
