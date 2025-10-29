import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FranceTravailJobsService } from './francetravail/francetravail-jobs.service.js';
import { NotionWorkshopService } from './notion/notion-workshop.service.js';
import { FranceTravailEventsService } from './francetravail/francetravail-events.service.js';
import { DataInclusionService } from './datainclusion/datainclusion.service.js';
import { GeolocService } from './geoloc/geoloc.service.js';
import { AICarePlanBuilderService } from './care-plan-builder/care-plan-builder-ai.service.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const server = new McpServer({
  name: 'care-plan-builder',
  version: '1.0.0'
});

const carePlanBuilderService = new AICarePlanBuilderService(
  new NotionWorkshopService(),
  new FranceTravailJobsService(),
  new FranceTravailEventsService(),
  new DataInclusionService(),
  new GeolocService(),
)
const carePlan = z.array(z.object({
  id: z.string(),
  categories: z.array(z.string()),
  title: z.string(),
  content: z.string(),
  cta: z.object({
    name: z.string(),
    link: z.string().optional()
  }).optional()
}));

server.registerTool(
  'care-plan-builder',
  {
    title: 'Build care plans',
    description: 'Generate a care plan based on a beneficiary profile',
    inputSchema: {
      profileText: z.string(),
    },
    outputSchema: {
      carePlan: carePlan,
      reasoning: z.string()
    }
  },
  async ({ profileText }) => {
    console.error(`[MCP] Generating care plan for profile (${profileText.length} chars)`);
    let reasoning = "";
    try {
      // Call the real AI service
      const result = await carePlanBuilderService.buildCarePlan({
        profileText,
        currentCarePlan: [],
      }, {
        onProgress: (progress) => {
          reasoning = reasoning + progress;
        }
      });

      const output = {
        carePlan: result.carePlan,
        reasoning
      };

      console.error(`[MCP] Care plan generated with ${result.carePlan.length} actions`);

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output
      };
    } catch (error) {
      console.error('[MCP] Error generating care plan:', error);
      throw error;
    }
  }
);

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Care plan builder server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});


