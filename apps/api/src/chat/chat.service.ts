import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { AIService } from '../ai/ai.service';
import { ChatRepository } from './chat.repository';
import { ChatSession } from './models/chat-session.model';
import { Message } from './models/message.model';
import { FranceTravailService, jobSearchDefinition } from '../francetravail/francetravail.service';
import { DataInclusionService, servicesSearchDefinition } from '../datainclusion/datainclusion.service';
import { FunctionCall, GenerateContentResponse } from '@google/genai';
import { GeolocService } from '../geoloc/geoloc.service';
import { Location } from 'src/geoloc/models/location.model';

const tools = [
  {
    functionDeclarations: [jobSearchDefinition, servicesSearchDefinition],
  },
];

@Injectable()
export class ChatService {
  constructor(
    private geolocService: GeolocService,
    private franceTravailService: FranceTravailService,
    private dataInclusionService: DataInclusionService,
    private aiService: AIService,
    private chatRepository: ChatRepository,
  ) {}

  async jobsSearch(functionCall: FunctionCall, municipalities: Location[]) {
    const jobTitles = functionCall.args['jobTitles'] as string[];
    const departmentsCode = [municipalities[0].departmentCode];
    console.log('Function calling with params:', jobTitles, departmentsCode);

    const jobOffers = await this.franceTravailService.searchJobOffers({
      jobTitles,
      departmentsCode,
    });
    console.log('Job offers length: ', jobOffers.length);
    return jobOffers;
  }

  async servicesSearch(functionCall: FunctionCall, municipalities: Location[]) {
    const thematiques = functionCall.args['thematiques'] as string[];
    const cityCode = municipalities[0].citycode
    console.log('Function calling with params:', thematiques, cityCode);
    const services = await this.dataInclusionService.searchServices({
      thematiques,
      codeCommune: cityCode,
    });
    console.log('Services length: ', services.length);
    return services;
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

          // First streaming call
          const streamGenerator = this.aiService.generateContentStream({
            chatSession: updatedSession,
            tools,
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

          // Handle function calls
          if (lastChunk?.functionCalls && lastChunk.functionCalls.length > 0) {
            const cityName = lastChunk.functionCalls[0].args[
              'cityName'
            ] as string;
            const municipalities =
              await this.geolocService.searchMunicipalities(cityName);
            const functionCallsData = lastChunk.functionCalls.map((fc) => ({
              name: fc.name,
              args: fc.args,
            }));

            subscriber.next({
              data: JSON.stringify({
                type: 'function_calls',
                messageId,
                functionCalls: functionCallsData,
              }),
            } as MessageEvent);

            for (const functionCall of lastChunk.functionCalls) {
              if (functionCall.name === jobSearchDefinition.name) {
                const jobs = await this.jobsSearch(
                  functionCall,
                  municipalities,
                );
                updatedSession = updatedSession.addFunctionCallResult(
                  functionCall.name,
                  { jobs },
                );
                this.chatRepository.save(updatedSession);
              }
              if (functionCall.name === servicesSearchDefinition.name) {
                const services = await this.servicesSearch(
                  functionCall,
                  municipalities,
                );
                updatedSession = updatedSession.addFunctionCallResult(
                  functionCall.name,
                  { services },
                );
                this.chatRepository.save(updatedSession);
              }
            }

            // Second streaming call with function results
            fullText = '';
            const secondStreamGenerator = this.aiService.generateContentStream({
              chatSession: updatedSession,
              tools,
            });

            for await (const chunk of secondStreamGenerator) {
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
          }

          // Save the complete message
          const assistantMessage = new Message(
            messageId,
            fullText,
            'assistant',
            timestamp,
          );
          updatedSession = updatedSession.addMessage(assistantMessage);
          this.chatRepository.save(updatedSession);

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
