# MCP Social Integration

Connects to the Bayes social MCP server to provide workforce and social resource search tools to conversation agents.

## Configuration

| Env var | Description | Example                   |
|---------|-------------|---------------------------|
| `MCP_SOCIAL_SERVER_URL` | MCP server endpoint | `https://xxx/mcp`         |
| `MCP_SOCIAL_API_KEY` | Bearer token for MCP auth | `sk-xxxxx` |

## Enable the feature flag

```sql
-- Replace <project_id> with the target project UUID
INSERT INTO feature_flag (id, project_id, feature_flag_key, enabled, created_at, updated_at)
VALUES (gen_random_uuid(), '<project_id>', 'bayes_social_mcp', true, now(), now());
```