export interface FunctionCallResult {
  name: string;
  response: Record<string, unknown>;
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly sender: 'user' | 'assistant' | 'function',
    public readonly timestamp: Date,
    public readonly functionCallResult?: FunctionCallResult,
  ) {}
}