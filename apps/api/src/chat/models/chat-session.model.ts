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

  addToolResponse(toolCallId: string, name: string, response: Record<string, unknown>): ChatSession {
    // Store the function name in the toolCallId for retrieval later
    // Format: "functionName-timestamp"
    const toolMessage = new Message(
      `tool-${Date.now()}`,
      JSON.stringify(response),
      'tool',
      new Date(),
      undefined,
      toolCallId, // This already contains the function name
    );
    return this.addMessage(toolMessage);
  }
}