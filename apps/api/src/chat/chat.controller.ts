import { Controller, Post, Sse, MessageEvent, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { CreateChatSessionResponseDto } from '@repo/api/chat/dto/create-chat-session.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('message-stream')
  streamMessage(
    @Query('sessionId') sessionId: string,
    @Query('content') content: string,
    @Query('country') country?: string,
  ): Observable<MessageEvent> {
    console.log(`new message ${sessionId}, country: ${country}`);
    return this.chatService.handleMessageStream(sessionId, content);
  }

  @Post('create-session')
  async createSession(
    @Query('country') country: 'fr'|'us',
  ): Promise<CreateChatSessionResponseDto> {
    console.log(`create session, country: ${country}`);
    const chatSession = await this.chatService.createSession(country);
    return {
      sessionId: chatSession.id,
      message: {
        id: chatSession.messages[0].id,
        content: chatSession.messages[0].content,
        timestamp: chatSession.messages[0].timestamp,
        sender: chatSession.messages[0].sender,
      },
    };
  }
}
