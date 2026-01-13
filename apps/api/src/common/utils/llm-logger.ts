// NOTE: This file is not used anymore, but keeping it here for reference

// import type { ContentListUnion } from "@google/genai";
// import * as fs from "fs";
// import * as path from "path";

// export interface LLMCallLog {
//   timestamp: string;
//   model: string;
//   temperature: number;
//   conversationHistory: ContentListUnion;
//   tools: any;
//   thinkingBudget?: number;
//   sessionId?: string;
// }

// export class LLMLogger {
//   private static logDirectory = path.join(process.cwd(), "llm-logs");

//   static initialize(): void {
//     // Create logs directory if it doesn't exist
//     if (!fs.existsSync(LLMLogger.logDirectory)) {
//       fs.mkdirSync(LLMLogger.logDirectory, { recursive: true });
//     }
//   }

//   static logCall(params: LLMCallLog): string {
//     LLMLogger.initialize();

//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const filename = `llm-call-${timestamp}.json`;
//     const filepath = path.join(LLMLogger.logDirectory, filename);

//     const logData = {
//       ...params,
//       timestamp: new Date().toISOString(),
//     };

//     try {
//       fs.writeFileSync(filepath, JSON.stringify(logData, null, 2), "utf-8");
//       console.log(`[LLM Logger] Logged call to: ${filepath}`);
//       return filepath;
//     } catch (error) {
//       console.error("[LLM Logger] Failed to write log:", error);
//       throw error;
//     }
//   }

//   static getLogDirectory(): string {
//     return LLMLogger.logDirectory;
//   }
// }
