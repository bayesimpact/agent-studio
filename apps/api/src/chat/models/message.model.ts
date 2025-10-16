export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly content: string | null,
    public readonly sender: 'user' | 'assistant' | 'tool',
    public readonly timestamp: Date,
    public readonly toolCalls?: ToolCall[],
    public readonly toolCallId?: string,
  ) {}
}