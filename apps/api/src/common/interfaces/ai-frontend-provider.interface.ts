import { FunctionDeclaration } from '@google/genai';

/**
 * Interface for AI service providers that execute only on the frontend
 * These providers don't make external API calls - they manipulate client-side state
 */
export interface AIFrontendProvider {
  /**
   * Returns the function declaration (tool schema) for the AI model
   */
  getFunctionDeclaration(): FunctionDeclaration;

  /**
   * Returns the prompt context that describes when and how to use this tool
   */
  getPromptContext(): string;
}