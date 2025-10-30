# Troubleshooting Guide

## Common Issues

### "Request timed out" during initialization

**Symptom**: Claude Desktop logs show timeout during MCP initialization
```
Message from client: {"jsonrpc":"2.0","method":"notifications/cancelled","params":{"requestId":0,"reason":"McpError: MCP error -32001: Request timed out"}}
```

**Solution**: This was fixed in the latest version with lazy initialization. Make sure you:
1. Pull latest changes: `git pull`
2. Rebuild: `npm run build`
3. Restart Claude Desktop

The server now initializes instantly and only connects to Google AI when a tool is actually called.

### Server not appearing in Claude Desktop

**Check the logs**:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Verify server starts correctly**:
```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
node dist/index.js
```

You should see:
```
=== Action Plan Builder MCP Server ===
Environment check:
- GOOGLE_CLOUD_PROJECT: ✓
- GOOGLE_APPLICATION_CREDENTIALS: ✓
- LOCATION: europe-west1
Action Plan Builder MCP Server running on stdio
```

If you see `✗ MISSING` for any environment variable:
1. Check `.env` file exists: `ls -la .env`
2. Check `.env` has correct values: `cat .env`
3. Make sure paths are absolute

### Environment variables not loading

**Issue**: Server shows `✗ MISSING` for environment variables

**Solution**:
1. Verify `.env` exists in the project root:
   ```bash
   ls /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server/.env
   ```

2. Check `.env` content:
   ```bash
   cat .env
   ```

3. Required format:
   ```
   GOOGLE_CLOUD_PROJECT=caseai-connect
   LOCATION=europe-west1
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
   ```

4. Make sure paths are absolute (start with `/`)

### Authentication errors when calling the tool

**Issue**: Tool call fails with Google Cloud authentication errors

**Verify credentials**:
```bash
# Check file exists
ls -la /path/from/your/.env/file.json

# Test authentication
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
gcloud auth application-default print-access-token
```

**Check service account permissions**:
- Go to Google Cloud Console
- IAM & Admin > IAM
- Find your service account
- Should have "Vertex AI User" role

### Server disconnects immediately

**Check stderr output in logs**: The server logs startup information to stderr which appears in Claude Desktop logs.

**Common causes**:
1. Missing or invalid `.env` file
2. Invalid service account credentials
3. Wrong project ID
4. Node.js version < 18

**Quick test**:
```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
node dist/index.js 2>&1 | head -10
```

Should show environment check with all ✓

### Claude Desktop config issues

**Verify config file location**:
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Should look like**:
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

**Common mistakes**:
- ❌ Relative path: `"args": ["./dist/index.js"]`
- ✅ Absolute path: `"args": ["/Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server/dist/index.js"]`
- ❌ Invalid JSON (trailing commas, missing quotes)
- ❌ Wrong command (should be `"node"`, not `"npm"`)

### Getting detailed logs

**Enable verbose logging** in your test:
```bash
cd /Users/jdoucy/Dev/bayesimpact/caseai-connect/apps/mcp-server
DEBUG=* node dist/index.js 2>&1
```

**Check Claude Desktop logs**:
```bash
# Watch logs in real-time
tail -f ~/Library/Logs/Claude/mcp-care-plan-builder*.log

# Or view recent logs
cat ~/Library/Logs/Claude/mcp-care-plan-builder*.log | tail -100
```

## Getting Help

If you're still having issues:

1. Check the startup output shows all ✓
2. Check Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`
3. Verify `.env` file has valid credentials
4. Test server manually: `node dist/index.js`
5. Check [SETUP.md](./SETUP.md) for complete setup instructions

## Performance Notes

- **Lazy initialization**: GoogleGenAI client is only created when first tool call is made
- **Startup time**: Server should start in < 1 second
- **First tool call**: May take 2-5 seconds due to AI client initialization
- **Subsequent calls**: Should be faster as client is reused
