import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LaborMarketDataService implements AIServiceProvider {
  private columbusOccupationsMarkdown: string;

  constructor() {
    // Load the static Columbus occupations markdown file
    const markdownPath = path.join(__dirname, 'rawmarkdown', 'aspyr.md');
    this.columbusOccupationsMarkdown = fs.readFileSync(markdownPath, 'utf-8');
  }

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'labor_market_insights',
      description: 'Get labor market insights for the Columbus, OH metropolitan area, including top occupations by job posting volume and median earnings',
      parameters: {
        type: Type.OBJECT,
        properties: {
          location: {
            type: Type.STRING,
            description: 'Metropolitan area location (e.g., "Columbus, OH")',
          },
        },
        required: ['location'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Tool: \`labor_market_insights\`
**Description**: Get labor market data for the Columbus, OH metropolitan area, showing top occupations ranked by demand (avg. monthly job postings) and median annual earnings.

**Parameters**:
- \`location\`: Metropolitan area in "City, State" format
  - Example: "Columbus, OH"

**Returns**: Occupation data table including:
- Occupation titles
- Average monthly job postings (demand indicator)
- Median annual earnings
- Useful for career exploration and understanding job market demand

**When to use**:
- When beneficiary is exploring career options
- To understand which occupations are in high demand
- To provide realistic salary expectations
- For career transition planning
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
  ): Promise<{ laborMarketData: string }> {
    const location = functionCall.args['location'] as string;

    console.log('Labor market insights requested for:', location);

    // Return the markdown data directly
    return { laborMarketData: this.columbusOccupationsMarkdown };
  }

  formatResultsForPrompt(result: { laborMarketData: string }): string {
    const { laborMarketData } = result;

    if (!laborMarketData) {
      return `**Labor Market Insights**: No data available.`;
    }

    return `**Labor Market Insights - Columbus Metropolitan Area**

${laborMarketData}

**How to use this data**:
- High job posting volumes (e.g., 494 for Registered Nurses) indicate strong demand and good job prospects
- Median earnings help set realistic salary expectations
- Consider occupations with both high demand and competitive earnings for career recommendations
- Use specific numbers when explaining career opportunities to the beneficiary
- For career transitions, identify occupations that match the beneficiary's skills and show high demand
- Consider entry-level positions (e.g., Retail Salespersons, Customer Service Representatives) for those needing immediate employment
- Healthcare occupations dominate the high-demand list - valuable for career counseling`;
  }
}