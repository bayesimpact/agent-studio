import { Injectable } from '@nestjs/common';
import {
  AbstractActionPlanBuilderService,
  Action,
  ActionPlanBuilderArgs,
  ActionPlanBuilderOptions,
} from './action-plan-builder.abstract';
import {
  GoogleGenAI,
  ToolListUnion,
  FunctionCall,
  GenerateContentResponse,
  Type,
} from '@google/genai';
import {
  Langfuse,
  LangfuseTraceClient,
} from 'langfuse';
import {
  buildSystemPrompt,
  buildPhase1Instructions,
  buildPhase2Instructions,
  buildUserPrompt,
} from './prompts/action-plan-builder.prompt';
import { NotionWorkshopService } from '../notion/notion-workshop.service';
import { FranceTravailJobsService } from '../francetravail/francetravail-jobs.service';
import { FranceTravailEventsService } from '../francetravail/francetravail-events.service';
import { FranceTravailLaBonneBoiteService } from '../francetravail/francetravail-labonneboite.service';
import { DataInclusionService } from '../datainclusion/datainclusion.service';
import { GeolocService } from '../geoloc/geoloc.service';
import { IndeedJobsService } from '../indeed/indeed-jobs.service';
import { LaborMarketDataService } from '../labormarketdata/labormarket.service';
import { CommunityProgramsService } from '../communityprograms/communityprograms.service';
import { TrainingProgramsService } from '../trainingprograms/trainingprograms.service';
import { Location } from '../geoloc/models/location.model';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';

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

function getFrench(country: string) {
  return country.toLowerCase() === 'fr';
}

@Injectable()
export class AIActionPlanBuilderService extends AbstractActionPlanBuilderService {
  private genAI: GoogleGenAI;
  private langfuse: Langfuse;

  constructor(
    private notionWorkshopService: NotionWorkshopService,
    private franceTravailJobsService: FranceTravailJobsService,
    private franceTravailEventsService: FranceTravailEventsService,
    private franceTravailLaBonneBoiteService: FranceTravailLaBonneBoiteService,
    private dataInclusionService: DataInclusionService,
    private geolocService: GeolocService,
    private indeedJobsService: IndeedJobsService,
    private laborMarketDataService: LaborMarketDataService,
    private communityProgramsService: CommunityProgramsService,
    private trainingProgramsService: TrainingProgramsService,
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
  }

  /**
   * Get tools based on country
   * France (fr): FranceTravail services + workshops + data inclusion
   * US (us): Indeed + labor market data + community programs + training programs
   */
  private getToolsForCountry(country: string): ToolListUnion {
    const isFrench = country.toLowerCase() === 'fr';
    const isUS = country.toLowerCase() === 'us';

    const functionDeclarations = [];

    if (isFrench) {
      functionDeclarations.push(
        this.notionWorkshopService.getFunctionDeclaration(),
        this.franceTravailJobsService.getFunctionDeclaration(),
        this.franceTravailEventsService.getFunctionDeclaration(),
        this.franceTravailLaBonneBoiteService.getFunctionDeclaration(),
        this.dataInclusionService.getFunctionDeclaration(),
      );
    } else if (isUS) {
      functionDeclarations.push(
        this.indeedJobsService.getFunctionDeclaration(),
        this.laborMarketDataService.getFunctionDeclaration(),
        this.communityProgramsService.getFunctionDeclaration(),
        this.trainingProgramsService.getFunctionDeclaration(),
      );
    }

    return [{ functionDeclarations }];
  }

  private async callAI(params: {
    systemPrompt: string;
    userPrompt: string;
    tools?: ToolListUnion;
    options?: ActionPlanBuilderOptions;
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
    country?: string,
    options?: ActionPlanBuilderOptions,
  ): Promise<FunctionCallResult[]> {
    console.log(
      '🔧 Action plan builder wants to call functions:',
      functionCalls.map((fc) => ({
        name: fc.name,
        args: fc.args,
      })),
    );
    options?.onProgress?.(getFrench(country)
      ? `\n## Appel d'outils\nRecherche de ressources...\n`
      : `\n## Calling tools\nSearching for resources...\n`);
    let locations: Location[] = [];

    const functionResults: FunctionCallResult[] = [];
    for (const functionCall of functionCalls) {
      // Resolve location once for all function calls (only for French services)
      if (getFrench(country) && locations.length === 0) {
        locations = await this.geolocService.searchMunicipalities(
          functionCall.args['cityName'] as string || '',//FIXME
        );
      }

      // Set French location parameters only for French services
      if (getFrench(country) && locations.length > 0) {
        functionCall.args['departmentsCode'] = [locations[0].departmentCode]
        functionCall.args['departmentCode'] = locations[0].departmentCode
        functionCall.args['cityCode'] = locations[0].citycode
      }

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
      } else if (functionCall.name === 'indeed_jobs_search') {
        result = await this.indeedJobsService.executeFunction(functionCall);
        source = 'indeed';
        console.log(`✅ Indeed job search returned ${result.jobOffers?.length || 0} results`);
      } else if (functionCall.name === 'events_search') {
        result = await this.franceTravailEventsService.executeFunction(functionCall);
        source = 'francetravail';
        console.log(`✅ Event search returned ${result.events?.length || 0} results`);
      } else if (functionCall.name === 'companies_search') {
        result = await this.franceTravailLaBonneBoiteService.executeFunction(functionCall);
        source = 'francetravail-labonneboite';
        console.log(`✅ Companies search returned ${result.companies?.length || 0} results`);
      } else if (functionCall.name === 'services_search') {
        result = await this.dataInclusionService.executeFunction(functionCall);
        source = 'datainclusion';
        console.log(`✅ Services search returned ${result.services?.length || 0} results`);
      } else if (functionCall.name === 'labor_market_insights') {
        result = await this.laborMarketDataService.executeFunction(functionCall);
        source = 'labor-market-data';
        console.log(`✅ Labor market insights returned`);
      } else if (functionCall.name === 'community_programs_search') {
        result = await this.communityProgramsService.executeFunction(functionCall);
        source = 'community-programs';
        console.log(`✅ Community programs search returned ${result.programs ? 'program data' : '0 results'}`);
      } else if (functionCall.name === 'training_programs_search') {
        result = await this.trainingProgramsService.executeFunction(functionCall);
        source = 'training-programs';
        console.log(`✅ Training programs search returned ${result.trainingPrograms ? 'program data' : '0 results'}`);
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

  private async rawStringToJson(
    rawOutput: string,
    trace: LangfuseTraceClient,
  ): Promise<{ actionPlan: Action[] }> {
    console.log('🔄 Extracting JSON from raw output using Gemini...');

    const model = 'gemini-2.5-flash';

    // Create Langfuse generation span for JSON extraction
    const extractionGeneration = trace.generation({
      name: 'extract-json-structured',
      model,
      modelParameters: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
      input: {
        rawOutputLength: rawOutput.length,
        task: 'Extract action plan JSON with structured output validation',
      },
      metadata: {
        phase: 'json-extraction',
        method: 'gemini-structured-output',
      },
    });

    try {
      const result = await this.genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Extract the action plan JSON from the following text. The JSON should contain an "actionPlan" array with actions.

Raw output:
${rawOutput}

Return ONLY the extracted JSON object with the "actionPlan" array.`,
              },
            ],
          },
        ],
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actionPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    categories: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    cta: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: {
                          type: Type.STRING,
                          enum: ['url', 'phone', 'email', 'address']
                        },
                        value: { type: Type.STRING },
                      },
                      required: ['name', 'type', 'value'],
                    },
                  },
                  required: ['id', 'categories', 'title', 'content'],
                },
              },
            },
            required: ['actionPlan'],
          },
        },
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Failed to extract JSON: No response from Gemini');
      }

      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.actionPlan || !Array.isArray(parsedResponse.actionPlan)) {
        throw new Error('Invalid action plan structure in extracted JSON');
      }

      console.log(`✅ Successfully extracted ${parsedResponse.actionPlan.length} actions from raw output`);

      // Update Langfuse with success
      const usageMetadata = result.usageMetadata || {};
      extractionGeneration.update({
        output: {
          actionsCount: parsedResponse.actionPlan.length,
          extractionSuccess: true,
        },
        usage: {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
          total: usageMetadata.totalTokenCount || 0,
          unit: 'TOKENS',
        },
      });
      extractionGeneration.end();

      return parsedResponse;
    } catch (error) {
      // Log error to Langfuse
      extractionGeneration.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'JSON extraction failed',
      });
      extractionGeneration.end();
      throw error;
    }
  }

  private buildSecondPrompt(
    firstResponseOutput: string,
    functionResults: FunctionCallResult[],
    country?: string,
  ): string {
    const lang = country === 'fr' ? 'French' : 'English';

    // Format results using each service's formatter
    const formattedResults = functionResults
      .map((fr) => {
        // Get the service provider based on function name
        let service: AIServiceProvider | undefined;
        if (fr.name === 'workshops_search') {
          service = this.notionWorkshopService;
        } else if (fr.name === 'jobs_search') {
          service = this.franceTravailJobsService;
        } else if (fr.name === 'indeed_jobs_search') {
          service = this.indeedJobsService;
        } else if (fr.name === 'events_search') {
          service = this.franceTravailEventsService;
        } else if (fr.name === 'companies_search') {
          service = this.franceTravailLaBonneBoiteService;
        } else if (fr.name === 'services_search') {
          service = this.dataInclusionService;
        } else if (fr.name === 'labor_market_insights') {
          service = this.laborMarketDataService;
        } else if (fr.name === 'community_programs_search') {
          service = this.communityProgramsService;
        } else if (fr.name === 'training_programs_search') {
          service = this.trainingProgramsService;
        }

        // Use custom formatter if available, otherwise fall back to JSON
        if (service && service.formatResultsForPrompt) {
          return service.formatResultsForPrompt(fr.result);
        } else {
          return `### ${fr.name} results\n${JSON.stringify(fr.result, null, 2)}`;
        }
      })
      .join('\n\n---\n\n');

    return `## Previous Analysis

${firstResponseOutput}

## Available Resources

Based on your analysis, here are the resources found:

${formattedResults}

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
3. **After your reflection, return the action plan in a JSON code block as specified in the system prompt**
4. All action titles, content, CTA names, and markdown section headers must be in ${lang}
`;
  }

  private async generateInitialAnalysis(
    systemPrompt: string,
    userPrompt: string,
    tools: ToolListUnion,
    options?: ActionPlanBuilderOptions,
  ): Promise<AIResponse> {
    return await this.callAI({
      systemPrompt,
      userPrompt,
      tools,
      options,
    });
  }

  private async generateFinalPlan(
    systemPrompt: string,
    secondUserPrompt: string,
    trace: LangfuseTraceClient,
    country?: string,
    options?: ActionPlanBuilderOptions,
  ): Promise<{
    fullOutput: string;
    usage: UsageMetadata;
  }> {
    options?.onProgress?.(getFrench(country)
      ? `\n## Génération du plan final\n`
      : `\n## Final action plan generation\n`);

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

  async buildActionPlan(
    args: ActionPlanBuilderArgs,
    options?: ActionPlanBuilderOptions,
  ): Promise<{ actionPlan: Action[] }> {
    const userPrompt = buildUserPrompt(args.profileText, args.country, args.currentActionPlan);

    // Build system prompt for Phase 1 with all tool contexts
    let toolContexts = '';

    // Add country-specific job search services
    if (args.country.toLowerCase() === 'fr') {
      toolContexts += this.notionWorkshopService.getPromptContext() + '\n';
      toolContexts += this.franceTravailJobsService.getPromptContext() + '\n';
      toolContexts += this.franceTravailEventsService.getPromptContext() + '\n';
      toolContexts += this.franceTravailLaBonneBoiteService.getPromptContext() + '\n';
      toolContexts += this.dataInclusionService.getPromptContext() + '\n';
    } else if (args.country.toLowerCase() === 'us') {
      toolContexts += this.indeedJobsService.getPromptContext() + '\n';
      toolContexts += this.laborMarketDataService.getPromptContext() + '\n';
      toolContexts += this.communityProgramsService.getPromptContext() + '\n';
      toolContexts += this.trainingProgramsService.getPromptContext() + '\n';
    }

    const firstSystemPrompt =
      buildSystemPrompt(args.country) +
      '\n\n## Available Tools\n\n' +
      `\n\nNode: if a tool need a country parameter, here it is: ${args.country}\n\n` +
      toolContexts +
      '\n' +
      buildPhase1Instructions(args.country);

    // Build system prompt for Phase 2 (no tools, just JSON output)
    const secondSystemPrompt = buildSystemPrompt(args.country) + '\n\n' + buildPhase2Instructions(args.country);

    // Get country-specific tools
    const tools = this.getToolsForCountry(args.country);

    // Create Langfuse trace
    const trace = this.langfuse.trace({
      name: 'action-plan-generation',
      metadata: {
        profileLength: args.profileText.length,
        hasCurrentPlan: !!args.currentActionPlan,
        country: args.country,
      },
    });

    const model = 'gemini-2.5-flash';
    const generation = trace.generation({
      name: 'generate-action-plan',
      model,
      modelParameters: {
        temperature: 0,
      },
      input: {
        systemInstruction: firstSystemPrompt,
        userPrompt,
      },
      metadata: {
        tools,
        phase: 'initial-analysis',
      },
    });

    const isFrench = getFrench(args.country);
    try {
      options?.onProgress?.(isFrench
        ? `## Création du plan d'action\n`
        : `## Action plan generation\n`);

      // Phase 1: Generate initial analysis and identify needed resources
      const firstResponse = await this.generateInitialAnalysis(
        firstSystemPrompt,
        userPrompt,
        tools,
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

      // Phase 2: If tools are needed, execute them and generate final plan
      if (
        firstResponse.functionCalls &&
        firstResponse.functionCalls.length > 0
      ) {
        // Execute tool calls and retrieve resources
        const functionResults = await this.executeToolCalls(
          firstResponse.functionCalls,
          trace,
          args.country,
          options,
        );

        // Build augmented prompt with retrieved resources
        const secondUserPrompt = this.buildSecondPrompt(
          firstResponse.fullOutput,
          functionResults,
          args.country,
        );

        // Generate final plan with resources
        const secondResponse = await this.generateFinalPlan(
          secondSystemPrompt,
          secondUserPrompt,
          trace,
          args.country,
          options,
        );

        finalOutput = secondResponse.fullOutput;
      }

      // Extract and validate action plan using Gemini with structured output
      options?.onProgress?.(isFrench
        ? `\n## Structuration du plan\n`
        : `\n## Plan structuration\n`);

      // Show processing message before completion
      options?.onProgress?.(isFrench
        ? `\n*Traitement en cours...*\n`
        : `\n*Processing...*\n`);

      const extractedResult = await this.rawStringToJson(finalOutput, trace);
      const actionPlan = extractedResult.actionPlan;

      // Validate actions
      for (const action of actionPlan) {
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

      options?.onProgress?.(isFrench
        ? `\n## Génération terminée\nPlan d'action créé avec ${actionPlan.length} actions.`
        : `\n## Action plan generation completed\nCreated with ${actionPlan.length} actions.`);

      return { actionPlan };
    } catch (error) {
      // Log error to Langfuse
      generation.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      generation.end();

      console.error('Error generating action plan:', error);
      throw new Error(
        `Failed to generate action plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      await this.langfuse.flushAsync();
    }
  }
}
