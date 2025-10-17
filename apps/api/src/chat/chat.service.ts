import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { AIService } from '../ai/ai.service';
import { ChatRepository } from './chat.repository';
import { ChatSession } from './models/chat-session.model';
import { Message } from './models/message.model';
import { ResourcesService } from '../resources/resources.service';
import {
  FunctionCall,
  GenerateContentResponse,
  ToolListUnion,
} from '@google/genai';
import { GeolocService } from '../geoloc/geoloc.service';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { AIFrontendProvider } from '../common/interfaces/ai-frontend-provider.interface';
import { CarePlanProvider } from '../care-plan/care-plan.provider';

@Injectable()
export class ChatService {
  private serviceProviders: Map<string, AIServiceProvider> = new Map();
  private frontendProviders: Map<string, AIFrontendProvider> = new Map();
  private tools: ToolListUnion;

  constructor(
    private geolocService: GeolocService,
    private resourcesService: ResourcesService,
    private carePlanProvider: CarePlanProvider,
    private aiService: AIService,
    private chatRepository: ChatRepository,
  ) {

    // Register service providers
    this.registerServiceProvider(this.resourcesService);

    // Register frontend providers
    this.registerFrontendProvider(this.carePlanProvider);

    // Build tools from all registered providers
    const allDeclarations = [
      ...Array.from(this.serviceProviders.values()).map((p) =>
        p.getFunctionDeclaration(),
      ),
      ...Array.from(this.frontendProviders.values()).map((p) =>
        p.getFunctionDeclaration(),
      ),
    ];

    this.tools = [
      {
        functionDeclarations: allDeclarations,
      },
    ];
  }

  private registerServiceProvider(provider: AIServiceProvider): void {
    const declaration = provider.getFunctionDeclaration();
    this.serviceProviders.set(declaration.name, provider);
    this.aiService.registerServiceProvider(provider);
  }

  private registerFrontendProvider(provider: AIFrontendProvider): void {
    const declaration = provider.getFunctionDeclaration();
    this.frontendProviders.set(declaration.name, provider);
    this.aiService.registerFrontendProvider(provider);
  }

  /**
   * Process function calls from LLM response
   * Follows proper conversational flow: assistant (with tool_calls) → tool → assistant (answer)
   * IMPORTANT: All tool responses must be added before saving to maintain proper message pairing
   */
  private async processFunctionCalls(
    functionCalls: FunctionCall[],
    session: ChatSession,
    toolCallsMessageId: string,
    subscriber: any,
  ): Promise<ChatSession> {
    let updatedSession = session;

    // Check if we have any backend function calls (that need cityName for geolocation)
    const backendFunctionCalls = functionCalls.filter((fc) =>
      this.serviceProviders.has(fc.name),
    );
    const frontendFunctionCalls = functionCalls.filter((fc) =>
      this.frontendProviders.has(fc.name),
    );

    const functionCallsData = functionCalls.map((fc) => ({
      name: fc.name,
      args: fc.args,
    }));
    console.log('functionCallsData', backendFunctionCalls);

    // Notify frontend about function calls
    subscriber.next({
      data: JSON.stringify({
        type: 'function_calls',
        messageId: toolCallsMessageId,
        functionCalls: functionCallsData,
      }),
    } as MessageEvent);

    // Process backend function calls (with geolocation)
    if (backendFunctionCalls.length > 0) {
      const cityName = backendFunctionCalls[0].args['cityName'] as string;
      const municipalities =
        await this.geolocService.searchMunicipalities(cityName);

      for (let i = 0; i < backendFunctionCalls.length; i++) {
        const functionCall = backendFunctionCalls[i];
        const provider = this.serviceProviders.get(functionCall.name);
        if (provider) {
          const result = await provider.executeFunction(
            functionCall,
            municipalities,
          );
          // Add tool response message with proper tool_call_id
          updatedSession = updatedSession.addToolResponse(
            functionCall.name,
            { result },
          );
          // DO NOT save yet - we need all tool responses before saving
        } else {
          console.warn(
            `No provider found for function: ${functionCall.name}`,
          );
        }
      }
    }

    // Frontend function calls are handled by the frontend - add acknowledgment as tool response
    for (let i = 0; i < frontendFunctionCalls.length; i++) {
      const functionCall = frontendFunctionCalls[i];
      updatedSession = updatedSession.addToolResponse(
        functionCall.name,
        { executed: 'frontend' },
      );
      // DO NOT save yet - we need all tool responses before saving
    }

    // NOW save once with all tool responses
    this.chatRepository.save(updatedSession);

    return updatedSession;
  }

  async createSession(): Promise<ChatSession> {
    const sessionId = v4();
    const initialMessage = new Message(
      v4(),
      'Bonjour, comment puis-je vous aider ?',
      'assistant',
      new Date(),
    );
    const session = new ChatSession(
      sessionId,
      [initialMessage],
      new Date(),
      new Date(),
    );
    this.chatRepository.save(session);
    return session;
  }

  handleMessageStream(
    sessionId: string,
    content: string,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const session = this.chatRepository.findById(sessionId);
          if (!session) {
            subscriber.error(new Error(`Session ${sessionId} not found`));
            return;
          }

          const userMessage = new Message(v4(), content, 'user', new Date());
          let updatedSession = session.addMessage(userMessage);
          this.chatRepository.save(updatedSession);

          const messageId = v4();
          const timestamp = new Date();

          // Send start event
          subscriber.next({
            data: JSON.stringify({
              type: 'start',
              messageId,
              timestamp: timestamp.toISOString(),
            }),
          } as MessageEvent);

          let fullText = '';

          const streamGenerator = this.aiService.generateContentStream({
            chatSession: updatedSession,
            tools: this.tools,
          });

          let lastChunk: GenerateContentResponse;
          for await (const chunk of streamGenerator) {
            lastChunk = chunk;
            const chunkText = chunk.text || '';
            fullText += chunkText;

            subscriber.next({
              data: JSON.stringify({
                type: 'chunk',
                content: chunkText,
                messageId,
              }),
            } as MessageEvent);
          }

          if (lastChunk?.functionCalls && lastChunk.functionCalls.length > 0) {
            const toolCallsData = lastChunk.functionCalls.map((fc) => ({
              id: v4(),
              name: fc.name,
              arguments: fc.args,
            }));

            const assistantToolCallMessage = new Message(
              messageId,
              null, // No text content yet
              'assistant',
              timestamp,
              toolCallsData,
            );
            console.info(assistantToolCallMessage);
            updatedSession = updatedSession.addMessage(assistantToolCallMessage);
            this.chatRepository.save(updatedSession);

            updatedSession = await this.processFunctionCalls(
              lastChunk.functionCalls,
              updatedSession,
              messageId,
              subscriber,
            );

            fullText = '';
            const secondStreamGenerator = this.aiService.generateContentStream({
              chatSession: updatedSession,
              tools: this.tools,
            });

            let secondLastChunk: GenerateContentResponse;
            for await (const chunk of secondStreamGenerator) {
              secondLastChunk = chunk;
              const chunkText = chunk.text || '';
              fullText += chunkText;

              subscriber.next({
                data: JSON.stringify({
                  type: 'chunk',
                  content: chunkText,
                  messageId,
                }),
              } as MessageEvent);
            }

            // Handle function calls from second LLM call (e.g., display_care_plan after jobs_search)
            if (
              secondLastChunk?.functionCalls &&
              secondLastChunk.functionCalls.length > 0
            ) {
              // Save second assistant message with tool_calls
              const secondToolCallsData = secondLastChunk.functionCalls.map((fc) => ({
                name: fc.name,
                arguments: fc.args,
              }));

              const secondAssistantToolCallMessage = new Message(
                v4(),
                null,
                'assistant',
                new Date(),
                secondToolCallsData,
              );
              updatedSession = updatedSession.addMessage(secondAssistantToolCallMessage);
              this.chatRepository.save(updatedSession);

              // Execute second round of function calls
              updatedSession = await this.processFunctionCalls(
                secondLastChunk.functionCalls,
                updatedSession,
                messageId,
                subscriber,
              );
            }
          }

          // Save the final complete assistant message with text content
          if (fullText) {
            const assistantMessage = new Message(
              v4(),
              fullText,
              'assistant',
              new Date(),
            );
            updatedSession = updatedSession.addMessage(assistantMessage);
            this.chatRepository.save(updatedSession);
          }

          // Send end event
          subscriber.next({
            data: JSON.stringify({
              type: 'end',
              messageId,
              fullContent: fullText,
              timestamp: timestamp.toISOString(),
            }),
          } as MessageEvent);

          subscriber.complete();
        } catch (error) {
          console.error('Error in message stream:', error);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              error: 'Sorry, I encountered an error processing your request.',
            }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }
}
