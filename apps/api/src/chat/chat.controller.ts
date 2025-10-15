import { Body, Controller, Post, Sse, MessageEvent, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SendMessageDto } from '@repo/api/chat/dto/send-message.dto';
import { MessageResponseDto } from '@repo/api/chat/dto/message-response.dto';
import { ChatService } from './chat.service';
import { CreateChatSessionResponseDto } from '@repo/api/chat/dto/create-chat-session.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('message-stream')
  streamMessage(
    @Query('sessionId') sessionId: string,
    @Query('content') content: string,
  ): Observable<MessageEvent> {
    console.log(`new message ${sessionId}`);
    return this.chatService.handleMessageStream(sessionId, content);
  }

  @Post('create-session')
  async createSession(): Promise<CreateChatSessionResponseDto> {
    const chatSession = await this.chatService.createSession();
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
