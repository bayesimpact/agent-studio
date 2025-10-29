# Setup Guide - Care Plan Builder MCP Server

## Overview

This MCP server uses **stdio transport** which means Claude Desktop will automatically start and manage the server process. You don't need to run the server manually!

## Step 1: Configure Environment

1. Copy the environment file:
```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
cp .env.example .env
```

2. Edit `.env` with your credentials:
```bash
nano .env  # or use your preferred editor
```

Required variables:
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID (e.g., "caseai-connect")
- `LOCATION` - GCP region (default: "europe-west1")
- `GOOGLE_APPLICATION_CREDENTIALS` - Absolute path to your service account key JSON file

### Getting Google Cloud Credentials

If you don't have a service account key:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin > Service Accounts**
3. Create a new service account or use existing one
4. Grant it **"Vertex AI User"** role
5. Click on the service account, go to **Keys** tab
6. Click **Add Key > Create new key > JSON**
7. Download the JSON key file and note its path

## Step 2: Install and Build

```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
npm install
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` folder.

## Step 3: Configure Claude Desktop

### macOS Configuration File Location
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows Configuration File Location
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Configuration Content

Add this to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "care-plan-builder": {
      "command": "node",
      "args": [
        "/Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important Notes**:
- Use the **absolute path** to `dist/index.js`
- Environment variables are automatically loaded from the `.env` file in the project directory
- Make sure the `.env` file exists and has valid credentials (see Step 1)

## Step 4: Restart Claude Desktop

After saving the configuration:
1. Quit Claude Desktop completely (Cmd+Q on Mac)
2. Reopen Claude Desktop
3. Claude will automatically start the MCP server

## Step 5: Verify Installation

In Claude Desktop, you should see:
- An MCP indicator showing the server is connected
- The `build_care_plan` tool available

## Step 6: Test the Tool

Try asking Claude:

```
Can you help me build a care plan for this profile:

Jean is 35 years old and lives in Paris. He has 10 years of experience in web
development but has been unemployed for 6 months. He wants to find a new position
as a full-stack developer. He has strong technical skills but lacks confidence in
job interviews. He is also interested in freelancing as a backup option.
```

Claude should use the `build_care_plan` tool and generate a personalized action plan in French.

## Troubleshooting

### MCP Server Not Loading

**Check Claude Desktop Logs**:
- macOS: `~/Library/Logs/Claude/mcp*.log`
- Windows: `%APPDATA%\Claude\Logs\mcp*.log`

**Common Issues**:

1. **Path not absolute**: Make sure all paths in config use absolute paths
   - ❌ Bad: `"./dist/index.js"`
   - ✅ Good: `"/Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server/dist/index.js"`

2. **dist/index.js doesn't exist**:
   ```bash
   cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
   ls -la dist/index.js
   # If missing, run: npm run build
   ```

3. **Node.js not found**:
   - Test: `which node` (should return a path)
   - Make sure Node.js >= 18 is installed

4. **Test the server manually**:
   ```bash
   cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
   GOOGLE_CLOUD_PROJECT=caseai-connect \
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
   node dist/index.js
   ```
   The server should start and not exit immediately.

### Authentication Errors

If you see authentication errors:

1. **Check credentials path**:
   ```bash
   ls -la /path/to/your/service-account-key.json
   ```

2. **Verify service account permissions**:
   - Go to Google Cloud Console
   - IAM & Admin > IAM
   - Find your service account
   - Should have "Vertex AI User" or "AI Platform Developer" role

3. **Test credentials manually**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
   gcloud auth application-default print-access-token
   ```

### Tool Not Appearing in Claude

1. **Check server is configured**: Look for MCP indicator in Claude Desktop
2. **Check logs**: See Claude Desktop logs for errors
3. **Restart Claude Desktop**: Completely quit and reopen
4. **Verify JSON syntax**: Make sure config file is valid JSON

### Cannot Find Module Errors

```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
npm install
npm run build
```

## Development

### Making Changes

After modifying the code:

```bash
npm run build
```

Then restart Claude Desktop to pick up changes.

### Development Mode

For rapid testing without Claude Desktop:

```bash
npm run dev
```

This runs the server with auto-reload but won't work with Claude Desktop (which needs the built version).

## Updating the Server

```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server

# Pull latest changes
git pull

# Reinstall dependencies if needed
npm install

# Rebuild
npm run build

# Restart Claude Desktop to load changes
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | Yes | - | Your GCP project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | - | Path to service account JSON key |
| `LOCATION` | No | `europe-west1` | GCP region for Vertex AI |

Set these in a `.env` file in the project root (recommended approach).