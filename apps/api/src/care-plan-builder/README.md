# Care Plan Builder SSE Endpoint

This module provides a Server-Sent Events (SSE) endpoint for generating care plans, allowing the MCP server to consume the API without duplicating business logic.

## Architecture

```
MCP Server → SSE Endpoint (NestJS Controller) → AICarePlanBuilderService → External Services
```

## Endpoint

**POST** `/care-plan-builder/generate`

### Request Body

```json
{
  "profileText": "string (required) - Full text description of the beneficiary profile",
  "currentCarePlan": [
    {
      "id": "string",
      "categories": ["string"],
      "title": "string",
      "content": "string",
      "cta": {
        "name": "string",
        "link": "string (optional)"
      }
    }
  ]
}
```

### Response (SSE Stream)

The endpoint returns a Server-Sent Events stream with the following event types:

#### Progress Event
```json
{
  "type": "progress",
  "data": {
    "message": "Progress update message..."
  }
}
```

#### Complete Event
```json
{
  "type": "complete",
  "data": {
    "carePlan": [
      {
        "id": "action-1",
        "categories": ["Emploi"],
        "title": "Action title",
        "content": "Action description...",
        "cta": {
          "name": "Apply now",
          "link": "https://example.com"
        }
      }
    ],
    "reasoning": "Full reasoning text accumulated from progress events..."
  }
}
```

#### Error Event
```json
{
  "type": "error",
  "data": {
    "error": "Error message"
  }
}
```

## Usage Example (cURL)

```bash
curl -X POST http://localhost:3000/care-plan-builder/generate \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "profileText": "Jean is a 35-year-old looking for work in IT with experience in web development."
  }'
```

## Usage from MCP Server

The MCP server automatically calls this endpoint when the `care-plan-builder` tool is invoked. See `apps/mcp-server/src/index.ts` for the implementation.

## Configuration

The MCP server uses the `API_BASE_URL` environment variable to configure the API endpoint:

```bash
# In apps/mcp-server/.env
API_BASE_URL=http://localhost:3000
```

## Benefits of This Architecture

1. **No Code Duplication**: Business logic stays in the NestJS API
2. **Single Source of Truth**: All care plan generation uses the same service
3. **Easier Maintenance**: Changes to the generation logic only need to be made once
4. **Streaming Support**: SSE allows real-time progress updates
5. **Separation of Concerns**: MCP server is a thin client, API handles the complexity