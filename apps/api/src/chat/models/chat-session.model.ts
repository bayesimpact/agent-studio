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

  addFunctionCallResult(name: string, response: Record<string, unknown>): ChatSession {
    const functionResultMessage = new Message(
      `func-${Date.now()}`,
      '',
      'user',
      new Date(),
      { name, response }
    );
    return this.addMessage(functionResultMessage);
  }
}