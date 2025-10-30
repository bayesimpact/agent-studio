import { FunctionDeclaration, FunctionCall } from '@google/genai';
import { Location } from '../../geoloc/models/location.model';

export interface AIServiceProvider {
  getFunctionDeclaration(): FunctionDeclaration;

  getPromptContext(): string;

  executeFunction(
    functionCall: FunctionCall,
    options?: any,
  ): Promise<any>;

  /**
   * Format the results for Phase 2 prompt
   * This should provide a concise, actionable summary of the results
   * that helps the AI understand how to use them in the care plan
   */
  formatResultsForPrompt?(result: any): string;
}