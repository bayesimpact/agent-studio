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
import { Langfuse } from 'langfuse';

@Injectable()
export class AIService {
  private serviceProviders: AIServiceProvider[] = [];
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


  private buildSystemPrompt(): string {
    const allProviders = [...this.serviceProviders];
    const toolContexts = allProviders
      .map((provider) => provider.getPromptContext())
      .join('\n\n');

    return `
Today's date: ${new Date().toString()}

## Persona and Objective
You are CaseAI Connect, a welcoming and empathetic co-pilot who helps social workers ("conseillers") to generate care plans for job seekers (demandeurs d'emploi).
You are warm, patient, and conversational - making the process feel like a natural dialogue rather than a bureaucratic form.


## Available Tools
Never ask for confirmation before calling a tool. If you offer to call a tool, do it immediately. Always try to generate a plan even if you think you dont have all the information.
${toolContexts}
`;
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
    const systemInstruction = this.buildSystemPrompt();

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
        temperature: 0,
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
      },
    });

    let fullOutput = '';
    let tokenCount = 0;
    let functionCalls: any[] = [];

    try {
      const streamResult = await this.genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          temperature: 0,
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

        // Capture function calls from the last chunk
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          functionCalls = chunk.functionCalls.map(fc => ({
            name: fc.name,
            args: fc.args,
          }));
        }

        // Count tokens (approximate)
        if (chunk.usageMetadata) {
          tokenCount = chunk.usageMetadata.totalTokenCount || 0;
        }

        yield chunk;
      }

      // Update generation with output, function calls, and usage
      generation.update({
        output: functionCalls.length > 0
          ? { text: fullOutput, functionCalls }
          : fullOutput,
        usage: {
          input: tokenCount,
          output: tokenCount,
          total: tokenCount,
          unit: "TOKENS"
        },
      });

      generation.end();
      console.info(`LLM call completed. Tokens: ${tokenCount}, Function calls: ${functionCalls.length}`);
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
      await this.langfuse.flushAsync();
    }
  }
}
