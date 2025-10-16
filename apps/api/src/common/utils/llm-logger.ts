import * as fs from 'fs';
import * as path from 'path';
import { ContentListUnion } from '@google/genai';

export interface LLMCallLog {
  timestamp: string;
  model: string;
  temperature: number;
  conversationHistory: ContentListUnion;
  tools: any;
  thinkingBudget?: number;
  sessionId?: string;
}

export class LLMLogger {
  private static logDirectory = path.join(process.cwd(), 'llm-logs');

  static initialize(): void {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  static logCall(params: LLMCallLog): string {
    this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `llm-call-${timestamp}.json`;
    const filepath = path.join(this.logDirectory, filename);

    const logData = {
      ...params,
      timestamp: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`[LLM Logger] Logged call to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[LLM Logger] Failed to write log:', error);
      throw error;
    }
  }

  static getLogDirectory(): string {
    return this.logDirectory;
  }
}