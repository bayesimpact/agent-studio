import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '../ai/ai.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { ChatRepository } from './chat.repository';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, ChatRepository],
      imports: [ConfigModule.forRoot(), AIModule, FranceTravailModule],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('handleMessage', () => {
    it('should return a message response from Gemini API', async () => {
      const session = await service.createSession()
      const message = await service.handleMessage(session.id,`
Jérémie est a 26 ans, il kiffe les jeux video, est très sociable, lance une recherche des offres d'emploi pour lui
Il vit à Dreux.
ne me demande pas confirmation, fait au mieux`);

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.sender).toBe('assistant');
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(typeof message.content).toBe('string');
      expect(message.content.length).toBeGreaterThan(0);
    }, 30000);


  });
});