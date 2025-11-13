import { Injectable } from '@nestjs/common';
import { ChatSession } from './models/chat-session.model';
import { Message } from './models/message.model';

@Injectable()
export class ChatRepository {
  private sessions: Map<string, ChatSession> = new Map();

  save(session: ChatSession): void {
    this.sessions.set(session.id, session);
  }

  findById(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

}