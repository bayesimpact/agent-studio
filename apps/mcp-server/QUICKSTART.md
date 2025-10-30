# Quick Reference

## Setup (One Time)

```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server

# Create .env file
cp .env.example .env

# Edit .env and add your Google Cloud credentials
# nano .env  # or use your preferred editor

# Install and build
npm install
npm run build
```

## Claude Desktop Config

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

**Note**: Environment variables are loaded from `.env` file in the project directory.

Then restart Claude Desktop.

## After Code Changes

```bash
npm run build
# Then restart Claude Desktop
```

## Troubleshooting

- **Not working?** See [SETUP.md](./SETUP.md) for detailed troubleshooting
- **Check logs**: `~/Library/Logs/Claude/mcp*.log`
- **Verify .env**: Make sure `.env` file exists with valid credentials
- **Test server**: `node dist/index.js` (should not exit immediately)