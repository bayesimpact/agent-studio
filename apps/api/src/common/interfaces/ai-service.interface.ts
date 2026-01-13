import type { FunctionCall, FunctionDeclaration } from "@google/genai"

export interface AIServiceProvider {
  getFunctionDeclaration(): FunctionDeclaration

  getPromptContext(): string

  executeFunction(
    functionCall: FunctionCall,
    options?: {
      onProgress?: (message: string) => void
    },
  ): Promise<unknown>

  /**
   * Format the results for Phase 2 prompt
   * This should provide a concise, actionable summary of the results
   * that helps the AI understand how to use them in the action plan
   */
  formatResultsForPrompt?(result: unknown): string
}
