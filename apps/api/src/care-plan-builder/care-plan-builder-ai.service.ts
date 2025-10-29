import { Injectable } from '@nestjs/common';
import {
  AbstractCarePlanBuilderService,
  Action,
  CarePlanBuilderArgs,
  CarePlanBuilderOptions,
} from './care-plan-builder.abstract';
import {
  GoogleGenAI,
  ToolListUnion,
  FunctionCall,
  GenerateContentResponse,
} from '@google/genai';
import {
  Langfuse,
  LangfuseTraceClient,
} from 'langfuse';
import {
  CARE_PLAN_BUILDER_SYSTEM_PROMPT,
  PHASE_1_INSTRUCTIONS,
  PHASE_2_INSTRUCTIONS,
  buildUserPrompt,
} from './prompts/care-plan-builder.prompt';
import { NotionWorkshopService } from '../notion/notion-workshop.service';
import { FranceTravailJobsService } from '../francetravail/francetravail-jobs.service';
import { FranceTravailEventsService } from '../francetravail/francetravail-events.service';
import { DataInclusionService } from '../datainclusion/datainclusion.service';
import { GeolocService } from '../geoloc/geoloc.service';
import { Location } from '../geoloc/models/location.model';

interface FunctionCallResult {
  name: string;
  result: unknown;
}

interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface AIResponse {
  fullOutput: string;
  functionCalls?: FunctionCall[];
  usage: UsageMetadata;
}

@Injectable()
export class AICarePlanBuilderService extends AbstractCarePlanBuilderService {
  private genAI: GoogleGenAI;
  private langfuse: Langfuse;
  private readonly tools: ToolListUnion;

  constructor(
    private notionWorkshopService: NotionWorkshopService,
    private franceTravailJobsService: FranceTravailJobsService,
    private franceTravailEventsService: FranceTravailEventsService,
    private dataInclusionService: DataInclusionService,
    private geolocService: GeolocService,
  ) {
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
          this.franceTravailJobsService.getFunctionDeclaration(),
          this.franceTravailEventsService.getFunctionDeclaration(),
          this.dataInclusionService.getFunctionDeclaration(),
        ],
      },
    ];
  }

  private async callAI(params: {
    systemPrompt: string;
    userPrompt: string;
    tools?: ToolListUnion;
    options?: CarePlanBuilderOptions;
  }): Promise<AIResponse> {
    const { systemPrompt, userPrompt, tools, options } = params;

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
        ...(tools && { tools }),
      },
    });

    let fullOutput = '';
    let lastChunk: GenerateContentResponse | undefined;

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
    }

    // Extract usage from last chunk
    const usageMetadata = lastChunk?.usageMetadata || {};

    return {
      fullOutput,
      functionCalls: lastChunk?.functionCalls,
      usage: {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      },
    };
  }

  private async executeToolCalls(
    functionCalls: FunctionCall[],
    trace: LangfuseTraceClient,
    options?: CarePlanBuilderOptions,
  ): Promise<FunctionCallResult[]> {
    console.log(
      '🔧 Care plan builder wants to call functions:',
      functionCalls.map((fc) => ({
        name: fc.name,
        args: fc.args,
      })),
    );
    options?.onProgress?.(`\n## Appel d'outils\nRecherche de ressources...\n`);
    let locations: Location[] = [];

    const functionResults: FunctionCallResult[] = [];
    for (const functionCall of functionCalls) {
      // Resolve location once for all function calls
      if (locations.length === 0) {
        locations = await this.geolocService.searchMunicipalities(
          functionCall.args['cityName'] as string || '',//FIXME
        );
      }
      functionCall.args['departmentsCode'] = [locations[0].departmentCode]
      functionCall.args['departmentCode'] = locations[0].departmentCode
      functionCall.args['cityCode'] = locations[0].citycode

      // Create a generic span for the retrieval step
      const retrievalSpan = trace.span({
        name: `${functionCall.name}-retrieval`,
        input: {
          function: functionCall.name,
          parameters: functionCall.args,
        },
      });

      let result: any;
      let source = 'unknown';

      // Execute the appropriate service based on function name
      if (functionCall.name === 'workshops_search') {
        result = await this.notionWorkshopService.executeFunction(functionCall);
        source = 'notion';
        console.log(`✅ Workshop search returned ${result.workshops?.length || 0} results`);
      } else if (functionCall.name === 'jobs_search') {
        result = await this.franceTravailJobsService.executeFunction(functionCall);
        source = 'francetravail';
        console.log(`✅ Job search returned ${result.jobOffers?.length || 0} results`);
      } else if (functionCall.name === 'events_search') {
        result = await this.franceTravailEventsService.executeFunction(functionCall);
        source = 'francetravail';
        console.log(`✅ Event search returned ${result.events?.length || 0} results`);
      } else if (functionCall.name === 'services_search') {
        result = await this.dataInclusionService.executeFunction(functionCall);
        source = 'datainclusion';
        console.log(`✅ Services search returned ${result.services?.length || 0} results`);
      }

      functionResults.push({
        name: functionCall.name,
        result,
      });

      // Update retrieval span with results
      retrievalSpan.update({
        output: result,
        metadata: {
          retrievalType: functionCall.name,
          source,
        },
      });
      retrievalSpan.end();
    }

    return functionResults;
  }

  private buildSecondPrompt(
    firstResponseOutput: string,
    functionResults: FunctionCallResult[],
  ): string {
    return `## Previous Analysis

${firstResponseOutput}

## Available Resources

Based on your analysis, here are the resources found:

${functionResults
  .map(
    (fr) => `### ${fr.name} results
${JSON.stringify(fr.result, null, 2)}`,
  )
  .join('\n\n')}

---

Now generate the final personalized action plan using these resources.

**Your reflection process for this phase should focus on**:
- Use "## Sélection des ressources" as the main section title
- Explain WHICH resources (workshops, jobs, events, etc.) from the results above are relevant for this beneficiary
- Explain WHY you selected or rejected specific resources based on the profile
- Document how you integrated the selected resources into specific actions

**Important**:
1. Use the previous analysis context to stay consistent with identified priorities
2. Include real resource links (workshops, jobs) in action CTAs when you select relevant items
3. **After your reflection, return the care plan in a JSON code block as specified in the system prompt**
4. All action titles, content, CTA names, and markdown section headers must be in French
`;
  }

  private async generateInitialAnalysis(
    systemPrompt: string,
    userPrompt: string,
    options?: CarePlanBuilderOptions,
  ): Promise<AIResponse> {
    return await this.callAI({
      systemPrompt,
      userPrompt,
      tools: this.tools,
      options,
    });
  }

  private async generateFinalPlan(
    systemPrompt: string,
    secondUserPrompt: string,
    trace: LangfuseTraceClient,
    options?: CarePlanBuilderOptions,
  ): Promise<{
    fullOutput: string;
    usage: UsageMetadata;
  }> {
    options?.onProgress?.(`\n## Génération du plan final\n`);

    // Create a second generation span for the final plan
    const secondGeneration = trace.generation({
      name: 'generate-final-plan',
      model: 'gemini-2.5-flash',
      modelParameters: {
        temperature: 0,
      },
      input: {
        systemInstruction: systemPrompt,
        userPrompt: secondUserPrompt,
      },
      metadata: {
        tools: [],
        phase: 'final-plan',
      },
    });

    const secondResponse = await this.callAI({
      systemPrompt,
      userPrompt: secondUserPrompt,
      options,
    });

    secondGeneration.update({
      output: {
        textResponse: secondResponse.fullOutput,
      },
      usage: {
        input: secondResponse.usage.inputTokens,
        output: secondResponse.usage.outputTokens,
        total: secondResponse.usage.totalTokens,
        unit: 'TOKENS',
      },
    });
    secondGeneration.end();

    return {
      fullOutput: secondResponse.fullOutput,
      usage: secondResponse.usage,
    };
  }

  async buildCarePlan(
    args: CarePlanBuilderArgs,
    options?: CarePlanBuilderOptions,
  ): Promise<{ carePlan: Action[] }> {
    const userPrompt = buildUserPrompt(args.profileText, args.currentCarePlan);

    // Build system prompt for Phase 1 with all tool contexts
    const firstSystemPrompt =
      CARE_PLAN_BUILDER_SYSTEM_PROMPT +
      '\n\n## Available Tools\n\n' +
      this.notionWorkshopService.getPromptContext() +
      '\n' +
      this.franceTravailJobsService.getPromptContext() +
      '\n' +
      this.franceTravailEventsService.getPromptContext() +
      '\n' +
      this.dataInclusionService.getPromptContext() +
      '\n\n' +
      PHASE_1_INSTRUCTIONS;

    // Build system prompt for Phase 2 (no tools, just JSON output)
    const secondSystemPrompt = CARE_PLAN_BUILDER_SYSTEM_PROMPT + '\n\n' + PHASE_2_INSTRUCTIONS;

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
        systemInstruction: firstSystemPrompt,
        userPrompt,
      },
      metadata: {
        tools: this.tools,
        phase: 'initial-analysis',
      },
    });

    try {
      options?.onProgress?.(`## Opérateur : Chargement du programme 'Création de plan d'action'
Programme chargé
`);

      // Phase 1: Generate initial analysis and identify needed resources
      const firstResponse = await this.generateInitialAnalysis(
        firstSystemPrompt,
        userPrompt,
        options,
      );

      // Update first generation trace with output
      generation.update({
        output: {
          textResponse: firstResponse.fullOutput,
          functionCalls: firstResponse.functionCalls?.map((fc) => ({
            name: fc.name,
            arguments: fc.args,
          })),
        },
        usage: {
          input: firstResponse.usage.inputTokens,
          output: firstResponse.usage.outputTokens,
          total: firstResponse.usage.totalTokens,
          unit: 'TOKENS',
        },
      });
      generation.end();

      let finalOutput = firstResponse.fullOutput;
      let carePlan: Action[];

      // Phase 2: If tools are needed, execute them and generate final plan
      if (
        firstResponse.functionCalls &&
        firstResponse.functionCalls.length > 0
      ) {
        // Execute tool calls and retrieve resources
        const functionResults = await this.executeToolCalls(
          firstResponse.functionCalls,
          trace,
          options,
        );

        // Build augmented prompt with retrieved resources
        const secondUserPrompt = this.buildSecondPrompt(
          firstResponse.fullOutput,
          functionResults,
        );

        // Generate final plan with resources
        const secondResponse = await this.generateFinalPlan(
          secondSystemPrompt,
          secondUserPrompt,
          trace,
          options,
        );

        finalOutput = secondResponse.fullOutput;
      }

      // Extract care plan from JSON code block
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

      carePlan = parsedResponse.carePlan;

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
