import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '../ai/ai.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { CarePlanModule } from '../care-plan/care-plan.module';
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
        CarePlanModule,
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
    it('should stream a care plan with both jobs and services, calling multiple search tools then display_care_plan', async () => {
      const session = await service.createSession();
      const stream = service.handleMessageStream(
        session.id,
        'Robert est au bout du rouleau, il a besoin d\'aide pour manger, faire ses repas, le ménage, ... il a aussi besoin d\'un job alimentaire à Rouen',
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

      // Verify we have function calls including at least one search tool and display_care_plan
      const functionCallEvents = events.filter((e) => e.type === 'function_calls');
      expect(functionCallEvents.length).toBeGreaterThanOrEqual(2);

      // Collect all function call names
      const allFunctionNames = functionCallEvents.flatMap(event =>
        event.functionCalls.map((fc: any) => fc.name)
      );

      // Should have called at least one search tool
      const hasJobsSearch = allFunctionNames.includes('jobs_search');
      const hasServicesSearch = allFunctionNames.includes('services_search');
      expect(hasJobsSearch || hasServicesSearch).toBe(true);

      // Must have called display_care_plan
      expect(allFunctionNames).toContain('display_care_plan');

      // Find the display_care_plan function call
      const displayCarePlanEvent = functionCallEvents.find(event =>
        event.functionCalls.some((fc: any) => fc.name === 'display_care_plan')
      );
      expect(displayCarePlanEvent).toBeDefined();

      const displayCarePlanCall = displayCarePlanEvent.functionCalls.find((fc: any) => fc.name === 'display_care_plan');
      expect(displayCarePlanCall).toBeDefined();
      expect(displayCarePlanCall.args).toBeDefined();
      expect(displayCarePlanCall.args.planItems).toBeDefined();
      expect(Array.isArray(displayCarePlanCall.args.planItems)).toBe(true);
      expect(displayCarePlanCall.args.planItems.length).toBeGreaterThan(0);

      // Verify care plan structure
      const planItems = displayCarePlanCall.args.planItems;

      // At least verify that plan items have correct structure
      planItems.forEach((item: any) => {
        expect(item.id).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.title).toBeDefined();
        expect(['job_search', 'service']).toContain(item.type);

        // If it's a job_search type, verify it has nested items
        if (item.type === 'job_search') {
          expect(item.items).toBeDefined();
          expect(Array.isArray(item.items)).toBe(true);
          expect(item.items.length).toBeGreaterThan(0);

          // Verify first job has required fields
          const firstJob = item.items[0];
          expect(firstJob.id).toBeDefined();
          expect(firstJob.title).toBeDefined();
          expect(firstJob.company).toBeDefined();
          expect(firstJob.location).toBeDefined();
        }

        // If it's a service type, it should be valid
        if (item.type === 'service') {
          // For now, just verify the service structure is valid
          // The service might have items or description depending on LLM's choice
          expect(item.id).toBeDefined();
          expect(item.title).toBeDefined();
        }
      });

    }, 60000); // 60 second timeout for API calls
  });
});
