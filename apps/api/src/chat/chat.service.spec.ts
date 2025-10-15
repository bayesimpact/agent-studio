import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '../ai/ai.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { JobListModule } from '../joblist/joblist.module';
import { ChatRepository } from './chat.repository';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, ChatRepository],
      imports: [
        ConfigModule.forRoot(),
        AIModule,
        FranceTravailModule,
        DataInclusionModule,
        GeolocModule,
        JobListModule,
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  /**
   * Helper function to collect all stream events into an array
   */
  async function collectStreamEvents(
    stream: Observable<MessageEvent>,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const events: any[] = [];

      stream.subscribe({
        next: (event) => {
          const data = JSON.parse(event.data as string);
          events.push(data);
        },
        error: (err) => reject(err),
        complete: () => resolve(events),
      });
    });
  }

  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const session = await service.createSession();

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.messages).toBeDefined();
      expect(session.messages.length).toBe(1);
      expect(session.messages[0].sender).toBe('assistant');
    });
  });

  describe('handleMessageStream', () => {
    it('should stream a message response with events, first calling jobs_search then joblist_display', async () => {
      const session = await service.createSession();
      const stream = service.handleMessageStream(
        session.id,
        'Jerem 42 ans cherche un emploi de développeur à Paris',
      );

      const events = await collectStreamEvents(stream);

      const eventTypes = events.map((e) => e.type);

      // Verify we have start and end events
      expect(eventTypes[0]).toBe('start');
      expect(eventTypes[eventTypes.length - 1]).toContain('end');

      const hasATextualResponse = eventTypes.includes('chunk');
      expect(hasATextualResponse).toBe(true);
      const hasAFunctionCall = eventTypes.includes('function_calls');
      expect(hasAFunctionCall).toBe(true);

      // Validate start event structure
      const startEvent = events[0];
      expect(startEvent).toBeDefined();
      expect(startEvent.messageId).toBeDefined();
      expect(startEvent.timestamp).toBeDefined();

      // Validate end event structure
      const endEvent = events[events.length - 1];
      expect(endEvent).toBeDefined();
      expect(endEvent.messageId).toBeDefined();
      expect(endEvent.timestamp).toBeDefined();

      // Verify function call sequence: jobs_search first, then joblist_display
      const functionCallEvents = events.filter((e) => e.type === 'function_calls');
      expect(functionCallEvents.length).toBeGreaterThanOrEqual(2);

      // First function call should be jobs_search
      const firstFunctionCall = functionCallEvents[0];
      expect(firstFunctionCall.functionCalls).toBeDefined();
      expect(firstFunctionCall.functionCalls.length).toBeGreaterThan(0);
      expect(firstFunctionCall.functionCalls[0].name).toBe('jobs_search');
      expect(firstFunctionCall.functionCalls[0].args).toBeDefined();
      expect(firstFunctionCall.functionCalls[0].args.jobTitles).toBeDefined();
      expect(firstFunctionCall.functionCalls[0].args.cityName).toBeDefined();

      // Second function call should be joblist_display
      const secondFunctionCall = functionCallEvents[1];
      expect(secondFunctionCall.functionCalls).toBeDefined();
      expect(secondFunctionCall.functionCalls.length).toBeGreaterThan(0);
      expect(secondFunctionCall.functionCalls[0].name).toBe('joblist_display');
      expect(secondFunctionCall.functionCalls[0].args).toBeDefined();
      expect(secondFunctionCall.functionCalls[0].args.jobs).toBeDefined();
      expect(Array.isArray(secondFunctionCall.functionCalls[0].args.jobs)).toBe(true);
      expect(secondFunctionCall.functionCalls[0].args.jobs.length).toBeGreaterThan(0);

    }, 60000); // 60 second timeout for API calls
  });
});
