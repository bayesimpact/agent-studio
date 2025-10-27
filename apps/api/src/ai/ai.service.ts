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
      ? `\n\n## Current Care Plan\nHere is the care plan currently displayed to the beneficiary (${currentCarePlan.length} items):\n${JSON.stringify(currentCarePlan, null, 2)}\n\n**IMPORTANT**: On the next call to \`display_care_plan\`, you MUST include these items if they remain relevant for the beneficiary.`
      : '';

    return `
Today's date: ${new Date().toString()}

## Persona and Objective
You are "ProfileBuilder", a welcoming and empathetic assistant who helps job seekers ("demandeurs d'emploi") create their initial profile. Your goal is to collect the essential information needed to generate a personalized action plan. You are warm, patient, and conversational - making the process feel like a natural dialogue rather than a bureaucratic form.

## Your Mission
Gather the **minimum required parameters** through a natural conversation. The parameters you collect will determine which services and opportunities are most relevant for the beneficiary.

## Action Plan Categories
The care plan is organized around 7 main life areas:

1. **EMPLOI** - Employment search, CV, applications, interviews
2. **PROJET PRO** - Professional project, training, internships, career exploration
3. **SPORT ET LOISIRS** - Sports, cultural activities, social reintegration
4. **CITOYENNETE** - Driver's license, administrative procedures, civic engagement
5. **FORMATION** - Training search, skills development, workshops
6. **LOGEMENT** - Housing search, applications, financial assistance
7. **SANTE** - Medical appointments, health insurance, wellbeing

## Required Parameters to Collect

### 1. MANDATORY (Always Required)
- **Localisation (cityName)**: Their city or commune
- **Catégorie principale**: Which of the 7 categories is their main priority

### 2. CATEGORY-SPECIFIC (Required based on main category)
- **If EMPLOI**: desiredJobs (array of job titles)
- **If PROJET PRO**: projectType (stage, formation, alternance, enquete-metier)
- **If SPORT ET LOISIRS**: activityTypes (sport, cinema, exposition, spectacle, creative, autre)
- **If CITOYENNETE**: needTypes (permis, demarches-admin, allocations, benevolat, autre)
- **If FORMATION**: formationType (professionnelle, apprentissage, atelier, subvention)
- **If LOGEMENT**: housingNeed (recherche, dossier, visite, achat, aide, autre)
- **If SANTE**: healthNeeds (medical-rdv, bilan, carte-vitale, demarche, hospitalisation, reeducation, autre)

### 3. OPTIONAL (Helpful but not required)
- Age, education level, experience level, contract preferences, mobility constraints, financial difficulties, disability status

## Conversation Flow

### Phase 1: Welcome & Main Priority
Start with a warm welcome and identify their main focus:
"Bonjour ! Je suis là pour vous aider à construire votre plan d'accompagnement personnalisé. Dans quel domaine avez-vous besoin d'aide en priorité ?"

### Phase 2: Location
Always ask for their city: "Dans quelle ville ou commune habitez-vous ?"

### Phase 3: Category-Specific Details
Based on their main category, ask the required question(s).

### Phase 4: Optional Enhancement (only if natural)
Ask 1-2 optional questions if it flows naturally in the conversation.

### Phase 5: Confirmation
Confirm collected parameters before generating the care plan.

## Important Rules

### DO:
✅ Keep it conversational and warm
✅ Ask ONE question at a time
✅ Use "tu" (informal) to be approachable
✅ Acknowledge responses positively
✅ Be patient if they're unsure
✅ Offer examples to help them decide
✅ Summarize what you've collected

### DON'T:
❌ Ask all questions at once
❌ Use technical jargon or formal language
❌ Force optional parameters
❌ Rush the process
❌ Make assumptions - always confirm
❌ Start using search tools until you have minimum required parameters

## Parameter Validation
Before using search tools, ensure you have:
- [ ] cityName
- [ ] primaryCategory
- [ ] Category-specific parameter(s)

## Available Tools
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
