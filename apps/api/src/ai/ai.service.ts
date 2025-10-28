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
import { Langfuse } from 'langfuse';

@Injectable()
export class AIService {
  private serviceProviders: AIServiceProvider[] = [];
  private frontendProviders: AIFrontendProvider[] = [];
  private genAI: GoogleGenAI;
  private langfuse: Langfuse;

  constructor() {
    this.genAI = new GoogleGenAI({
      vertexai: true,
      project: 'caseai-connect',
      location: process.env.LOCATION || 'europe-west1',
    });

    // Initialize Langfuse
    this.langfuse = new Langfuse({
      secretKey: process.env.LANGFUSE_SK,
      publicKey: process.env.LANGFUSE_PK,
      baseUrl: process.env.LANGFUSE_BASE_URL,
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

## Conversation Flow - ULTRA PROGRESSIVE AND NON-BLOCKING

### GOLDEN RULE: Call display_profile AFTER EVERY USER RESPONSE that provides data

### Phase 1: Welcome & Main Priority (1 exchange)
Start with a warm welcome and identify their main focus:
"Bonjour ! Je suis là pour vous aider. Dans quel domaine avez-vous besoin d'aide ? Emploi, formation, logement, santé... ?"
→ User responds with category → **IMMEDIATELY call display_profile with {"mandatory": {"primaryCategory": "emploi"}}**

### Phase 2: Location (1 exchange)
Ask for their city: "Dans quelle ville habitez-vous ?"
→ User responds with city → **IMMEDIATELY call display_profile with {"mandatory": {"primaryCategory": "emploi", "cityName": "Paris"}}**

### Phase 3: Category-Specific Details (1 exchange)
Based on their category, ask ONE specific question.
→ User responds → **IMMEDIATELY call display_profile with complete mandatory + category-specific data**
→ **THEN IMMEDIATELY call search_resources**
→ **THEN IMMEDIATELY call display_care_plan**

DO NOT wait. DO NOT ask for confirmation. DO NOT summarize. Just DO IT.

### Phase 4: Progressive Enhancement (optional)
While displaying results, you can ask 1-2 optional questions naturally, but NEVER block on them.

## CRITICAL RULES - READ CAREFULLY

### MANDATORY BEHAVIOR:
✅ **Call display_profile AFTER EVERY user response that provides data (even one field)**
✅ **After getting city + category + category-specific → IMMEDIATELY call search_resources (NO confirmation needed)**
✅ **Then IMMEDIATELY call display_care_plan with results**
✅ Display profile with PARTIAL data - show it even with just one field
✅ Be conversational but FAST - maximum 3-4 exchanges before showing results
✅ Use "tu" (informal) to be approachable

### ABSOLUTELY FORBIDDEN:
❌ **NEVER ask "Souhaitez-vous que je recherche..." - JUST DO IT**
❌ **NEVER ask "Voulez-vous voir..." - JUST SHOW IT**
❌ **NEVER summarize and wait - CALL THE TOOLS**
❌ **NEVER say "J'ai bien noté" without calling display_profile**
❌ **NEVER wait for confirmation before searching**
❌ Ask all questions at once
❌ Use technical jargon
❌ Force optional parameters

## EXACT FLOW YOU MUST FOLLOW

Example conversation:
- User: "Je cherche du travail"
- You: "Dans quelle ville ?"
- User: "Paris"
- You: "Quel type de poste ?"
- User: "Développeur"
- You: [CALL display_profile] [CALL search_resources] [CALL display_care_plan] "Voici votre profil et les opportunités que j'ai trouvées pour vous !"

**NO INTERMEDIATE CONFIRMATION. NO SUMMARY WITHOUT ACTION.**

If you have cityName + primaryCategory + category-specific:
- Call display_profile (even if optional fields are missing)
- Call search_resources immediately
- Display results with display_care_plan
- Continue conversation naturally while results are shown

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
    turnNumber,
  }: {
    chatSession: ChatSession;
    tools: ToolListUnion;
    turnNumber?: number;
  }): AsyncGenerator<GenerateContentResponse> {
    console.info(`Calling LLM for session ${chatSession.id} (turn ${turnNumber || 'unknown'})`);
    const contents = this.buildContents(chatSession);
    const currentCarePlan = this.extractCurrentCarePlan(chatSession);
    const systemInstruction = this.buildSystemPrompt(currentCarePlan);

    // Create or get existing Langfuse trace for this session
    // Use consistent trace ID based on session ID so all turns are in one trace
    const trace = this.langfuse.trace({
      id: `session-${chatSession.id}`,
      name: 'chat-session',
      sessionId: chatSession.id,
      userId: chatSession.id,
      metadata: {
        sessionId: chatSession.id,
        totalMessages: chatSession.messages.length,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
      },
    });

    // Create generation span for this specific turn
    const generation = trace.generation({
      name: `turn-${turnNumber || chatSession.messages.length}`,
      model: 'gemini-2.5-flash',
      modelParameters: {
        temperature: 0.1,
        thinkingBudget: 0,
      },
      input: {
        systemInstruction,
        contents,
      },
      metadata: {
        turnNumber: turnNumber || chatSession.messages.length,
        systemInstructionLength: systemInstruction.length,
        toolsCount: Array.isArray(tools) ? tools.length : 0,
        hasCarePlan: !!currentCarePlan,
      },
    });

    let fullOutput = '';
    let tokenCount = 0;

    try {
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
        // Accumulate output for Langfuse
        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            if (part.text) {
              fullOutput += part.text;
            }
          }
        }

        // Count tokens (approximate)
        if (chunk.usageMetadata) {
          tokenCount = chunk.usageMetadata.totalTokenCount || 0;
        }

        yield chunk;
      }

      // Update generation with output and usage
      generation.update({
        output: fullOutput,
        usage: {
          input: tokenCount > 0 ? Math.floor(tokenCount * 0.7) : undefined, // Approximate
          output: tokenCount > 0 ? Math.floor(tokenCount * 0.3) : undefined, // Approximate
          total: tokenCount,
        },
      });

      generation.end();
      console.info(`LLM call completed. Tokens: ${tokenCount}`);
    } catch (error) {
      // Log error to Langfuse
      generation.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      generation.end();

      console.error('[AI Service] LLM call failed:', error);
      throw error;
    } finally {
      // Ensure Langfuse flushes the trace
      await this.langfuse.flushAsync();
    }
  }
}
