import { Controller, Sse, Post, MessageEvent, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrendresoinService } from './prendresoin.service';

@Controller('prendresoin')
export class PrendresoinController {
  constructor(private readonly prendresoinService: PrendresoinService) {}

  @Post('create-session')
  async createSession(): Promise<{
    sessionId: string;
    message: {
      id: string;
      content: string;
      sender: string;
      timestamp: Date;
    };
  }> {
    console.log('Creating new prendresoin session');
    const session = await this.prendresoinService.createSession();
    return {
      sessionId: session.id,
      message: session.messages[0],
    };
  }

  @Sse('message-stream')
  streamMessage(
    @Query('sessionId') sessionId: string,
    @Query('content') content: string,
  ): Observable<MessageEvent> {
    console.log(`New message in session ${sessionId}: ${content}`);
    return this.prendresoinService.handleMessageStream(sessionId, content);
  }
}