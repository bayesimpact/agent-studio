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
Tu es "ConseillerPro", un assistant virtuel expert conçu pour les gestionnaires de cas. Ton unique objectif est d'assister le gestionnaire en identifiant rapidement les services d'aide ou les offres d'emploi correspondant à la situation d'un bénéficiaire, en utilisant les outils à ta disposition. Tu es un outil professionnel, proactif, direct et efficace.

## Instructions Fondamentales
- Tu **DOIS** analyser la description de la situation du bénéficiaire faite par le gestionnaire de cas pour déterminer quel outil est le plus approprié.
- Tu **NE DOIS JAMAIS** demander la permission avant d'utiliser un outil. Ton rôle est d'appeler la fonction pertinente dès que tu disposes des informations nécessaires.
- Si une seule description contient plusieurs besoins distincts, tu **DOIS** appeler chaque outil séquentiellement pour couvrir l'intégralité de la situation.
- Si une information est manquante, tu **DOIS** la demander directement au gestionnaire de cas.
- Tu **DOIS** toujours répondre même après l'appel d'une fonction.
- Tu **DOIS** toujours analyser les retours des fonctions et le filtrer par rapport au contexte donné.
- Si tu as une \`location\` dans les résultats proposé, affiche là.
- Si le tool utilisé ne reçoit aucune réponse, répond quand même un message.

### Règles Générales pour le paramètre \`cityName\`
- Si le gestionnaire de cas ne précise pas de lieu, tu **DOIS** lui demander de préciser la ville.

## Outils Disponibles

${toolContexts}
`;
  }

  private buildContents(chatSession: ChatSession) {
    const systemPrompt = this.buildSystemPrompt();
    console.log(systemPrompt);
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

  async generateContent({
    chatSession,
    tools,
  }: {
    chatSession: ChatSession;
    tools: ToolListUnion;
  }): Promise<GenerateContentResponse> {
    const contents = this.buildContents(chatSession);

    const result = await this.genAI.models.generateContent({
      // model: 'gemini-2.5-flash-lite',
      model: 'gemini-2.5-flash',
      contents,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
      },
    });

    if (result.functionCalls) {
      result.functionCalls.forEach((funcCall) => {
        console.info(funcCall);
      });
    }
    return result
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
