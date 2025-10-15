import { FunctionDeclaration, FunctionCall } from '@google/genai';
import { Location } from '../../geoloc/models/location.model';

export interface AIServiceProvider {
  getFunctionDeclaration(): FunctionDeclaration;

  getPromptContext(): string;

  executeFunction(
    functionCall: FunctionCall,
    locations: Location[],
  ): Promise<any>;
}