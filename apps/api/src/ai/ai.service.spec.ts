import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { ChatSession } from '../chat/models/chat-session.model';
import { Message } from '../chat/models/message.model';

describe('AIService', () => {
  let service: AIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIService],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  describe('buildContents', () => {
    it('should build contents with system prompt for empty session', () => {
      const session = new ChatSession(
        'session-1',
        [],
        new Date(),
        new Date(),
      );

      // Access private method via type assertion
      const contents = (service as any).buildContents(session);

      expect(contents).toBeDefined();
      expect(contents.length).toBe(1);
      expect(contents[0].role).toBe('model');
      expect(contents[0].parts[0].text).toContain('ConseillerPro');
    });

    it('should include user messages in contents', () => {
      const userMessage = new Message(
        'msg-1',
        'Hello, I need help',
        'user',
        new Date(),
      );
      const session = new ChatSession(
        'session-1',
        [userMessage],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      expect(contents.length).toBe(2); // System prompt + user message
      expect(contents[1].role).toBe('user');
      expect(contents[1].parts[0].text).toBe('Hello, I need help');
    });

    it('should include assistant messages in contents', () => {
      const assistantMessage = new Message(
        'msg-1',
        'How can I help you?',
        'assistant',
        new Date(),
      );
      const session = new ChatSession(
        'session-1',
        [assistantMessage],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      expect(contents.length).toBe(2); // System prompt + assistant message
      expect(contents[1].role).toBe('model');
      expect(contents[1].parts[0].text).toBe('How can I help you?');
    });

    it('should handle function calls in assistant messages', () => {
      const functionCallMessage = new Message(
        'msg-1',
        null,
        'assistant',
        new Date(),
        [
          {
            name: 'jobs_search',
            arguments: { cityName: 'Paris', keywords: 'developer' },
          },
        ],
      );
      const session = new ChatSession(
        'session-1',
        [functionCallMessage],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      expect(contents.length).toBe(2);
      expect(contents[1].role).toBe('model');
      expect(contents[1].parts.length).toBe(1);
      expect(contents[1].parts[0].functionCall).toBeDefined();
      expect(contents[1].parts[0].functionCall.name).toBe('jobs_search');
      expect(contents[1].parts[0].functionCall.args.cityName).toBe('Paris');
    });

    it('should create one functionResponse per tool message', () => {
      const functionCallMessage = new Message(
        'msg-1',
        null,
        'assistant',
        new Date(),
        [
          {
            name: 'jobs_search',
            arguments: { cityName: 'Paris' },
          },
        ],
      );
      const toolResponseMessage = new Message(
        'msg-2',
        JSON.stringify({ result: 'job data' }),
        'tool',
        new Date(),
        [{ name: 'jobs_search', arguments: {} }],
      );
      const session = new ChatSession(
        'session-1',
        [functionCallMessage, toolResponseMessage],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      // System prompt + function call + tool response
      expect(contents.length).toBe(3);

      // Verify function call
      expect(contents[1].role).toBe('model');
      expect(contents[1].parts[0].functionCall.name).toBe('jobs_search');

      // Verify tool response
      expect(contents[2].role).toBe('user');
      expect(contents[2].parts.length).toBe(1);
      expect(contents[2].parts[0].functionResponse).toBeDefined();
      expect(contents[2].parts[0].functionResponse.name).toBe('jobs_search');
      expect(contents[2].parts[0].functionResponse.response.result).toBe('job data');
    });

    it('should group multiple consecutive tool responses into ONE user message with MULTIPLE parts', () => {
      const functionCallMessage = new Message(
        'msg-1',
        null,
        'assistant',
        new Date(),
        [
          { name: 'jobs_search', arguments: {} },
          { name: 'services_search', arguments: {} },
        ],
      );
      const toolResponse1 = new Message(
        'msg-2',
        JSON.stringify({ result: 'jobs' }),
        'tool',
        new Date(),
        [{ name: 'jobs_search', arguments: {} }],
      );
      const toolResponse2 = new Message(
        'msg-3',
        JSON.stringify({ result: 'services' }),
        'tool',
        new Date(),
        [{ name: 'services_search', arguments: {} }],
      );
      const session = new ChatSession(
        'session-1',
        [functionCallMessage, toolResponse1, toolResponse2],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      // System prompt + function calls + ONE grouped user message
      expect(contents.length).toBe(3);

      // Grouped tool responses in ONE user message with MULTIPLE parts
      expect(contents[2].role).toBe('user');
      expect(contents[2].parts.length).toBe(2); // TWO parts in one message

      // First part
      expect(contents[2].parts[0].functionResponse.name).toBe('jobs_search');
      expect(contents[2].parts[0].functionResponse.response.result).toBe('jobs');

      // Second part
      expect(contents[2].parts[1].functionResponse.name).toBe('services_search');
      expect(contents[2].parts[1].functionResponse.response.result).toBe('services');
    });

    it('should handle complex conversation flow with multiple function calls and responses', () => {
      const messages = [
        new Message('msg-1', 'Find me jobs in Paris', 'user', new Date()),
        new Message(
          'msg-2',
          null,
          'assistant',
          new Date(),
          [{ name: 'jobs_search', arguments: { cityName: 'Paris' } }],
        ),
        new Message(
          'msg-3',
          JSON.stringify({ result: 'jobs data' }),
          'tool',
          new Date(),
          [{ name: 'jobs_search', arguments: {} }],
        ),
        new Message('msg-4', 'Here are the jobs', 'assistant', new Date()),
        new Message('msg-5', 'Now find services', 'user', new Date()),
        new Message(
          'msg-6',
          null,
          'assistant',
          new Date(),
          [{ name: 'services_search', arguments: { cityName: 'Paris' } }],
        ),
        new Message(
          'msg-7',
          JSON.stringify({ result: 'services data' }),
          'tool',
          new Date(),
          [{ name: 'services_search', arguments: {} }],
        ),
        new Message('msg-8', 'Here are the services', 'assistant', new Date()),
      ];
      const session = new ChatSession('session-1', messages, new Date(), new Date());

      const contents = (service as any).buildContents(session);

      // System + user + func_call + tool_resp + asst + user + func_call + tool_resp + asst
      expect(contents.length).toBe(9);

      // Verify structure
      expect(contents[0].role).toBe('model'); // System
      expect(contents[1].role).toBe('user'); // User message
      expect(contents[2].role).toBe('model'); // Function call
      expect(contents[2].parts[0].functionCall.name).toBe('jobs_search');
      expect(contents[3].role).toBe('user'); // Tool response
      expect(contents[3].parts[0].functionResponse.name).toBe('jobs_search');
      expect(contents[4].role).toBe('model'); // Assistant text
      expect(contents[5].role).toBe('user'); // User message
      expect(contents[6].role).toBe('model'); // Function call
      expect(contents[6].parts[0].functionCall.name).toBe('services_search');
      expect(contents[7].role).toBe('user'); // Tool response
      expect(contents[7].parts[0].functionResponse.name).toBe('services_search');
      expect(contents[8].role).toBe('model'); // Assistant text
    });

    it('should handle multiple function calls in a single assistant message', () => {
      const functionCallMessage = new Message(
        'msg-1',
        null,
        'assistant',
        new Date(),
        [
          { name: 'jobs_search', arguments: { cityName: 'Paris' } },
          { name: 'display_care_plan', arguments: { planItems: [] } },
        ],
      );
      const session = new ChatSession(
        'session-1',
        [functionCallMessage],
        new Date(),
        new Date(),
      );

      const contents = (service as any).buildContents(session);

      expect(contents.length).toBe(2);
      expect(contents[1].role).toBe('model');
      expect(contents[1].parts.length).toBe(2); // Two function calls
      expect(contents[1].parts[0].functionCall.name).toBe('jobs_search');
      expect(contents[1].parts[1].functionCall.name).toBe('display_care_plan');
    });
  });
});