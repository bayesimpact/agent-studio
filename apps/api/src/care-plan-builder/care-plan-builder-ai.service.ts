import { Injectable } from '@nestjs/common';
import {
  AbstractCarePlanBuilderService,
  Action,
  CarePlanBuilderArgs,
  CarePlanBuilderOptions,
} from './care-plan-builder.abstract';
import { GoogleGenAI, ToolListUnion } from '@google/genai';
import { Langfuse } from 'langfuse';
import {
  CARE_PLAN_BUILDER_SYSTEM_PROMPT,
  buildUserPrompt,
} from './prompts/care-plan-builder.prompt';
import { NotionWorkshopService } from '../notion/notion-workshop.service';

@Injectable()
export class AICarePlanBuilderService extends AbstractCarePlanBuilderService {
  private genAI: GoogleGenAI;
  private langfuse: Langfuse;
  private tools: ToolListUnion;

  constructor(private notionWorkshopService: NotionWorkshopService) {
    super();
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

    // Setup tools for the care plan builder agent
    this.tools = [
      {
        functionDeclarations: [
          this.notionWorkshopService.getFunctionDeclaration(),
        ],
      },
    ];
  }

  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    options?: CarePlanBuilderOptions,
  ): Promise<{ fullOutput: string; functionCalls?: any[]; tokenCount: number }> {
    const model = 'gemini-2.5-flash';
    const streamResult = await this.genAI.models.generateContentStream({
      model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        temperature: 0,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        systemInstruction: systemPrompt,
        tools: this.tools,
      },
    });

    let fullOutput = '';
    let tokenCount = 0;
    let lastChunk: any;

    for await (const chunk of streamResult) {
      lastChunk = chunk;
      // Accumulate thinking and response
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.text) {
            fullOutput += part.text;
            options?.onProgress?.(part.text);
          }
        }
      }

      // Count tokens
      if (chunk.usageMetadata) {
        tokenCount = chunk.usageMetadata.totalTokenCount || 0;
      }
    }

    return {
      fullOutput,
      functionCalls: lastChunk?.functionCalls || [],
      tokenCount,
    };
  }

  async buildCarePlan(
    args: CarePlanBuilderArgs,
    options?: CarePlanBuilderOptions,
  ): Promise<{ carePlan: Action[] }> {
    // Build system prompt with tool context
    const systemPrompt = CARE_PLAN_BUILDER_SYSTEM_PROMPT + '\n\n## Available Tools\n\n' + this.notionWorkshopService.getPromptContext();
    const userPrompt = buildUserPrompt(args.profileText, args.currentCarePlan);

    // Create Langfuse trace
    const trace = this.langfuse.trace({
      name: 'care-plan-generation',
      metadata: {
        profileLength: args.profileText.length,
        hasCurrentPlan: !!args.currentCarePlan,
      },
    });

    const model = 'gemini-2.5-flash';
    const generation = trace.generation({
      name: 'generate-care-plan',
      model,
      modelParameters: {
        temperature: 0,
      },
      input: {
        systemInstruction: systemPrompt,
        userPrompt,
      },
    });

    try {
      options?.onProgress?.(`## Opérateur : Chargement du programme 'Création de plan d'action'
Programme chargé
`,
      );

      // First AI call: Get reasoning and potential function calls
      const firstResponse = await this.callAI(systemPrompt, userPrompt, options);

      let finalOutput = firstResponse.fullOutput;
      let totalTokenCount = firstResponse.tokenCount;

      // Check if AI wants to call functions
      if (firstResponse.functionCalls && firstResponse.functionCalls.length > 0) {
        console.log('🔧 Care plan builder wants to call functions:',
          firstResponse.functionCalls.map((fc: any) => ({
            name: fc.name,
            args: fc.args
          }))
        );
        options?.onProgress?.(`\n## Appel d'outils\nRecherche d'ateliers et formations...\n`);

        // Execute function calls with Langfuse tracing (RAG retrieval pattern)
        const functionResults: any[] = [];
        for (const functionCall of firstResponse.functionCalls) {
          if (functionCall.name === 'workshops_search') {
            // Create a span for the retrieval step
            const retrievalSpan = trace.span({
              name: 'workshop-retrieval',
              input: {
                function: functionCall.name,
                parameters: functionCall.args,
              },
            });

            const result = await this.notionWorkshopService.executeFunction(functionCall);

            functionResults.push({
              name: functionCall.name,
              result,
            });

            console.log(`✅ Workshop search returned ${result.workshops?.length || 0} results`);

            // Update retrieval span with results
            retrievalSpan.update({
              output: {
                workshopCount: result.workshops?.length || 0,
                workshops: result.workshops?.map((w: any) => ({
                  title: w.title,
                  date: w.date,
                  type: w.type,
                })),
              },
              metadata: {
                retrievalType: 'workshop_search',
                source: 'notion',
              },
            });
            retrievalSpan.end();
          }
        }

        // Build second prompt with function results and previous thinking
        const secondUserPrompt = `## Previous Analysis

${firstResponse.fullOutput}

## Available Resources

Based on your analysis, here are the workshops and formations found:

${functionResults.map(fr => `### ${fr.name} results
${JSON.stringify(fr.result, null, 2)}`).join('\n\n')}

---

Now generate the final personalized action plan using these resources.

**Your reflection process for this phase should focus on**:
- Use "## Sélection des ressources" as the main section title
- Explain WHICH workshops/formations from the results above are relevant for this beneficiary
- Explain WHY you selected or rejected specific resources based on the profile
- Document how you integrated the selected resources into specific actions

**Important**:
1. Use the previous analysis context to stay consistent with identified priorities
2. Include real workshop links in action CTAs when you select relevant workshops
3. End your response with the action plan JSON in a code block \`\`\`json
4. All action titles, content, CTA names, and markdown section headers must be in French
`;

        options?.onProgress?.(`\n## Génération du plan final\n`);

        // Second AI call: Generate final plan with resources
        const secondResponse = await this.callAI(systemPrompt, secondUserPrompt, options);
        finalOutput = secondResponse.fullOutput;
        totalTokenCount += secondResponse.tokenCount;
      }

      // Extract JSON from response
      const jsonMatch = finalOutput.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error(
          'Failed to extract JSON from AI response. Response format invalid.',
        );
      }

      const jsonText = jsonMatch[1];
      const parsedResponse = JSON.parse(jsonText);

      if (!parsedResponse.carePlan || !Array.isArray(parsedResponse.carePlan)) {
        throw new Error('Invalid care plan structure in AI response');
      }

      const carePlan: Action[] = parsedResponse.carePlan;

      // Validate actions
      for (const action of carePlan) {
        if (
          !action.id ||
          !action.title ||
          !action.content ||
          !action.categories
        ) {
          throw new Error(
            `Invalid action structure: ${JSON.stringify(action)}`,
          );
        }
      }

      // Update Langfuse with results
      generation.update({
        output: { carePlan },
        usage: {
          input: totalTokenCount,
          output: totalTokenCount,
          total: totalTokenCount,
          unit: 'TOKENS',
        },
      });
      generation.end();

      options?.onProgress?.(`
## Génération terminée
Plan d'action créé avec ${carePlan.length} actions.`);

      return { carePlan };
    } catch (error) {
      // Log error to Langfuse
      generation.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      generation.end();

      console.error('Error generating care plan:', error);
      throw new Error(
        `Failed to generate care plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      await this.langfuse.flushAsync();
    }
  }
}
