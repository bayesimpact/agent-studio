export class MessageDto {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'function';
  timestamp: Date;
}