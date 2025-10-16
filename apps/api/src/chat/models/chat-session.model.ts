import { Message } from './message.model';

export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly messages: Message[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  addMessage(message: Message): ChatSession {
    return new ChatSession(
      this.id,
      [...this.messages, message],
      this.createdAt,
      new Date(),
    );
  }

  addToolResponse(name: string, response: Record<string, unknown>): ChatSession {
    // Store toolCallId and name in toolCalls array for proper mapping in buildContents
    const toolMessage = new Message(
      `tool-${Date.now()}`,
      JSON.stringify(response),
      'tool',
      new Date(),
      [{ name, arguments: {} }],
    );
    return this.addMessage(toolMessage);
  }
}