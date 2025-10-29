import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

// API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const server = new McpServer({
  name: 'care-plan-builder',
  version: '1.0.0'
});

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

interface SSEEvent {
  type: 'progress' | 'complete' | 'error';
  data?: {
    message?: string;
    carePlan?: any[];
    reasoning?: string;
    error?: string;
  };
}

server.registerTool(
  'care-plan-builder',
  {
    title: 'Build care plans',
    description: 'Generate a care plan based on a beneficiary profile',
    inputSchema: {
      profileText: z.string(),
      currentCarePlan: z.array(z.object({
        id: z.string(),
        categories: z.array(z.string()),
        title: z.string(),
        content: z.string(),
        cta: z.object({
          name: z.string(),
          link: z.string().optional()
        }).optional()
      })).optional(),
    },
    outputSchema: {
      carePlan: carePlan,
      reasoning: z.string()
    }
  },
  async ({ profileText, currentCarePlan }, extra) => {
    console.error(`[MCP] Generating care plan for profile (${profileText.length} chars)`);
    let reasoning = "";
    let finalCarePlan: any[] = [];

    try {
      // Call the NestJS SSE endpoint
      const response = await axios.post(
        `${API_BASE_URL}/care-plan-builder/generate`,
        {
          profileText,
          currentCarePlan: currentCarePlan || [],
        },
        {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
          },
        }
      );


      // Process SSE stream
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();

          // Parse SSE format: "data: {...}\n\n"
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6)) as SSEEvent;

                if (eventData.type === 'progress' && eventData.data?.message) {
                  reasoning += eventData.data.message;
                  console.error(`[MCP] Progress: ${eventData.data.message.substring(0, 100)}...`);

                  // Send progress notification using the MCP protocol
                  if (extra._meta?.progressToken) {
                    server.server.notification({
                      method: 'notifications/progress',
                      params: {
                        progressToken: extra._meta.progressToken,
                        progress: reasoning.length,
                        total: undefined,
                        message: eventData.data.message,
                      }
                    }).catch(err => {
                      console.error('[MCP] Failed to send progress notification:', err);
                    });
                  }
                } else if (eventData.type === 'complete' && eventData.data) {
                  finalCarePlan = eventData.data.carePlan || [];
                  if (eventData.data.reasoning) {
                    reasoning = eventData.data.reasoning;
                  }
                  console.error(`[MCP] Care plan generated with ${finalCarePlan.length} actions`);
                } else if (eventData.type === 'error') {
                  reject(new Error(eventData.data?.error || 'Unknown error'));
                }
              } catch (parseError) {
                console.error('[MCP] Error parsing SSE event:', parseError);
              }
            }
          }
        });

        response.data.on('end', () => {
          const output = {
            carePlan: finalCarePlan,
            reasoning
          };

          resolve({
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          });
        });

        response.data.on('error', (error: Error) => {
          console.error('[MCP] Stream error:', error);
          reject(error);
        });
      });
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


