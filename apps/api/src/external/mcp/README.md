# MCP Server Integration

Generic integration for external MCP (Model Context Protocol) servers. Supports preset servers (e.g., Bayes Social) and future custom user-provided servers.

## Architecture

- **`mcp_server`** table: catalog of available servers (presets and custom), with encrypted connection config
- **`agent_mcp_server`** table: junction enabling specific servers per agent
- At runtime, the streaming service queries all enabled servers for the agent, connects to each, and merges their tools

## Configuration

| Env var | Description |
|---------|-------------|
| `MCP_ENCRYPTION_KEY` | 64-character hex string (32 bytes) for AES-256-GCM encryption of server configs |

Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Setup

### 1. Create an MCP server preset

```bash
cd apps/api && npm run seed:mcp-preset
```

### 2. Enable the server for an agent

```sql
INSERT INTO agent_mcp_server (id, agent_id, mcp_server_id, enabled, created_at, updated_at)
VALUES (gen_random_uuid(), '<agent_id>', '<mcp_server_id>', true, now(), now());
```
