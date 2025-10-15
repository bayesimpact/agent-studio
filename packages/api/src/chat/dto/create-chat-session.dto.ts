import { MessageDto } from './message.dto';

export class CreateChatSessionResponseDto {
  sessionId: string
  message: MessageDto
}