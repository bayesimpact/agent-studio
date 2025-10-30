# Action Plan Builder MCP Server

This is an MCP (Model Context Protocol) server that exposes the care plan builder functionality to Claude Desktop and other MCP clients.

## Features

- Generate personalized care plans based on beneficiary profiles
- Update existing care plans with new information
- Structured output with categorized actions in French
- AI-powered analysis using Google Vertex AI (Gemini 2.5 Pro)
- Stdio transport for seamless Claude Desktop integration

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference (copy/paste config)
- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting

## Quick Start

```bash
# Setup .env file
cp .env.example .env
# Edit .env with your Google Cloud credentials

# Install and build
npm install
npm run build
```

Then configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "action-plan-builder": {
      "command": "node",
      "args": [
        "/Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server/dist/index.js"
      ]
    }
  }
}
```

Environment variables are loaded from the `.env` file. Restart Claude Desktop. See [SETUP.md](./SETUP.md) for detailed instructions.

## Prerequisites

1. Google Cloud Project with Vertex AI API enabled
2. Service account key with "Vertex AI User" role
3. Node.js >= 18

## Tool: build_care_plan

### Parameters

- `profileText` (required): Full text description of the beneficiary's profile including:
  - Current situation
  - Location (city/region)
  - Professional background
  - Skills and experience
  - Goals and objectives
  - Challenges or barriers

- `currentCarePlan` (optional): Array of existing actions to update or refine

### Example Usage in Claude

```
Can you help me build a care plan for this profile:

Jean is 35 years old and lives in Paris. He has 10 years of experience in web development but has been unemployed for 6 months. He wants to find a new position as a full-stack developer. He has strong technical skills but lacks confidence in job interviews. He is also interested in freelancing as a backup option.
```

### Response Format

The tool returns:
- `carePlan`: Array of Action objects with:
  - `id`: Unique identifier
  - `categories`: Array of category tags
  - `title`: Action title in French
  - `content`: Detailed description in French
  - `cta`: Optional call-to-action with `name` and optional `link`
- `reasoning`: The AI's thought process and analysis

## Development

### Watch Mode

For development with auto-reload:
```bash
npm run dev
```

### Project Structure

```
apps/mcp-server/
├── src/
│   ├── index.ts              # MCP server setup
│   ├── care-plan-builder.ts  # Core logic
│   ├── prompts.ts            # AI prompts
│   └── types.ts              # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication

This server uses Google Cloud Vertex AI. Make sure you have:

1. A Google Cloud project with Vertex AI API enabled
2. A service account with the following roles:
   - Vertex AI User
   - AI Platform Developer
3. Service account key downloaded and path set in `GOOGLE_APPLICATION_CREDENTIALS`

## Troubleshooting

### Authentication Errors

If you see authentication errors, verify:
- `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account key
- The service account has the necessary Vertex AI permissions
- The project ID in `GOOGLE_CLOUD_PROJECT` matches your GCP project

### Claude Desktop Not Loading Server

If the server doesn't appear in Claude Desktop:
- Check the configuration file path is correct
- Verify all paths are absolute (not relative)
- Check Claude Desktop logs for error messages
- Restart Claude Desktop after configuration changes

## License

UNLICENSED