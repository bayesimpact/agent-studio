import { Injectable } from '@nestjs/common';
import {
  Content,
  ContentListUnion,
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
      // location: 'europe-west9',
      location: 'europe-west1',
    });
  }

  registerServiceProvider(provider: AIServiceProvider): void {
    this.serviceProviders.push(provider);
  }

  registerFrontendProvider(provider: AIFrontendProvider): void {
    this.frontendProviders.push(provider);
  }

  private buildSystemPrompt(currentCarePlan?: any[]): string {
    const allProviders = [...this.serviceProviders, ...this.frontendProviders];
    const toolContexts = allProviders
      .map((provider) => provider.getPromptContext())
      .join('\n\n');

    const carePlanContext = currentCarePlan && currentCarePlan.length > 0
      ? `\n\n## Plan d'Accompagnement Actuel\nVoici le plan d'accompagnement actuellement affiché au bénéficiaire (${currentCarePlan.length} éléments) :\n${JSON.stringify(currentCarePlan, null, 2)}\n\n**IMPORTANT** : Lors du prochain appel à \`display_care_plan\`, tu DOIS inclure ces éléments s'ils restent pertinents pour le bénéficiaire.`
      : '';

    return `
Nous somme le: ${new Date().toString()}

## Persona et Objectif
Tu es "ConseillerPro", un assistant virtuel expert qui accompagne directement les bénéficiaires dans leur recherche d'emploi et leur parcours d'insertion. Ton rôle est d'aider les bénéficiaires à trouver des offres d'emploi et des services pertinents adaptés à leur situation. Tu es empathique, encourageant, proactif et bienveillant, tout en restant professionnel et efficace.
${carePlanContext}

## Workflow Principal
Ton objectif est de **créer des plans d'accompagnement personnalisés** en suivant ce processus:

1. **Comprendre les besoins** : Écoute la situation du bénéficiaire et pose des questions si nécessaire pour bien comprendre ses besoins, compétences et contraintes
2. **Récupérer les données** : Utilise les outils de recherche (\`jobs_search\`, \`services_search\`) pour obtenir les données brutes
3. **Filtrer intelligemment** : Analyse et sélectionne les 3-10 meilleurs éléments selon :
   - La pertinence pour le profil et les aspirations du bénéficiaire
   - La qualité des informations
   - Le type de contrat ou service (privilégie CDI, etc.)
   - La localisation et accessibilité
4. **Afficher le plan** : **TOUJOURS** appeler \`display_care_plan\` après avoir appelé un outil de recherche
5. **Expliquer avec bienveillance** : Donne un message encourageant et personnalisé basé **uniquement sur ce qui est affiché**, en expliquant pourquoi ces opportunités sont adaptées

**🔴 RÈGLE ABSOLUE** : Après avoir appelé \`jobs_search\` ou \`services_search\`, tu **DOIS OBLIGATOIREMENT** appeler \`display_care_plan\`. Pas d'exception.

## Gestion du Plan d'Accompagnement (IMPORTANT)
Le plan d'accompagnement affiché via \`display_care_plan\` est **persistant** et visible en permanence pour le bénéficiaire :

- **Approche incrémentale** : À chaque nouvel appel de \`display_care_plan\`, tu DOIS **conserver les éléments précédents** qui restent pertinents
- **Ajouter de nouveaux éléments** : Intègre les nouvelles offres/services trouvés aux éléments existants
- **Supprimer uniquement si non pertinent** : Retire un élément précédent UNIQUEMENT s'il n'est plus adapté aux besoins actuels
- **Limiter la taille** : Garde un maximum de 15-20 éléments au total, en privilégiant les plus pertinents

**Exemple :**
- Le bénéficiaire des emplois de restauration à Paris → Tu affiches 5 offres
- Le bénéficiaire demande aussi des services d'aide alimentaire → Tu affiches les 5 offres précédentes + 5 nouveaux services
- Il souhaite maintenant explorer le bâtiment → Tu remplaces les offres de restauration par les offres de bâtiment, mais tu **GARDES** les services d'aide alimentaire car ils restent pertinents

**En résumé** : Le plan d'accompagnement s'enrichit au fil de la conversation, sauf si le contexte change radicalement.

## Instructions Fondamentales
- Tu **NE DOIS JAMAIS** demander la permission avant d'utiliser un outil
- Sois à l'écoute : si le bénéficiaire exprime plusieurs besoins, appelle chaque outil séquentiellement
- Si une information manque (notamment la ville, le métier recherché), demande-la **avec bienveillance AVANT** d'appeler l'outil
- Tu **DOIS** toujours répondre après l'appel d'une fonction avec un message personnalisé et encourageant
- Ta réponse textuelle doit être basée **UNIQUEMENT sur ce que tu affiches** dans \`display_care_plan\`, pas sur les résultats bruts
- Ne **JAMAIS** lister les éléments en texte (les cartes visuelles le font déjà)
- Adopte un ton chaleureux et encourageant : tutoie le bénéficiaire, valorise ses démarches, et montre ton soutien

## Outils Disponibles

${toolContexts}
`;
  }

  private extractCurrentCarePlan(chatSession: ChatSession): any[] | undefined {
    // Find the most recent display_care_plan call in the conversation
    for (let i = chatSession.messages.length - 1; i >= 0; i--) {
      const message = chatSession.messages[i];
      if (message.sender === 'assistant' && message.toolCalls) {
        const carePlanCall = message.toolCalls.find(tc => tc.name === 'display_care_plan');
        if (carePlanCall && carePlanCall.arguments['planItems']) {
          return carePlanCall.arguments['planItems'] as any[];
        }
      }
    }
    return undefined;
  }

  private buildContents(chatSession: ChatSession): ContentListUnion {
    const contents: Content[] = [];

    // Group consecutive tool responses into ONE user message with MULTIPLE functionResponse parts
    let toolResponseParts: any[] = [];

    for (const message of chatSession.messages) {
      if (message.sender === 'tool') {
        // Accumulate tool responses with matching IDs
        const functionName = message.toolCalls[0].name;
        toolResponseParts.push({
          functionResponse: {
            name: functionName,
            response: JSON.parse(message.content || '{}')
          }
        });
      } else {
        // Flush accumulated tool responses before adding non-tool message
        if (toolResponseParts.length > 0) {
          contents.push({ role: 'user', parts: toolResponseParts });
          toolResponseParts = [];
        }

        // Add non-tool message
        if (message.sender === 'assistant' && message.toolCalls?.length) {
          // Assistant message with function calls (each with ID)
          contents.push({
            role: 'model',
            parts: message.toolCalls.map(tc => ({
              functionCall: {
                name: tc.name,
                args: tc.arguments
              }
            }))
          });
        } else {
          // Regular user or assistant text message
          contents.push({
            role: message.sender === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content || '' }]
          });
        }
      }
    }

    // Flush any remaining tool responses
    if (toolResponseParts.length > 0) {
      contents.push({ role: 'user', parts: toolResponseParts });
    }

    return contents;
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
    const currentCarePlan = this.extractCurrentCarePlan(chatSession);
    const systemInstruction = this.buildSystemPrompt(currentCarePlan);

    // Log the LLM call parameters to a JSON file
    // try {
    //   LLMLogger.logCall({
    //     timestamp: new Date().toISOString(),
    //     model: 'gemini-2.5-flash',
    //     temperature: 0.1,
    //     conversationHistory: contents,
    //     tools,
    //     thinkingBudget: 0,
    //     sessionId: chatSession.id,
    //   });
    // } catch (error) {
    //   console.error('[AI Service] Failed to log LLM call:', error);
    //   // Continue execution even if logging fails
    // }
    const streamResult = await this.genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        temperature: 0.1,
        systemInstruction,
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
