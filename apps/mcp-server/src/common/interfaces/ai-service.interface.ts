import { FunctionDeclaration, FunctionCall } from '@google/genai';
import { Location } from '../../geoloc/models/location.model.js';

export interface AIServiceProvider {
  getFunctionDeclaration(): FunctionDeclaration;

  getPromptContext(): string;

  executeFunction(
    functionCall: FunctionCall,
    options?: any,
  ): Promise<any>;
}