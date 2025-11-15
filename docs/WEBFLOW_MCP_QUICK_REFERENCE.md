# Webflow MCP Integration - Quick Reference

## API Endpoints Cheat Sheet

### 🔍 Read Data from Webflow

```bash
# List all modules from Webflow CMS
curl http://localhost:3000/api/mcp/webflow/modules

# Get specific module
curl http://localhost:3000/api/mcp/webflow/modules/system-prompt-template

# Search modules
curl "http://localhost:3000/api/mcp/webflow/search?q=system"

# Get categories
curl http://localhost:3000/api/mcp/webflow/categories

# Get tags
curl http://localhost:3000/api/mcp/webflow/tags
```

### 🔄 Sync Data

```bash
# Sync from Webflow → Supabase (pull)
curl -X POST http://localhost:3000/api/mcp/webflow/sync/pull

# Sync from Supabase → Webflow (push)
curl -X POST http://localhost:3000/api/mcp/webflow/sync/push

# Check sync status for a module
curl http://localhost:3000/api/mcp/webflow/sync-status/system-prompt-template
```

### 🪝 Webhooks

```bash
# Test webhook (always succeeds)
curl -X POST http://localhost:3000/webhooks/webflow/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Production webhook (needs Webflow signature)
# Webflow sends to: https://yourdomain.com/webhooks/webflow
# Automatically triggers sync on publish/update events
```

---

## Setup Steps

### 1. Get Webflow Credentials

```bash
# In Webflow Account Settings → API Access
export WEBFLOW_API_TOKEN="your_token_here"
export WEBFLOW_SITE_ID="your_site_id_here"
export WEBFLOW_COLLECTION_ID="modules_collection_id"
export WEBFLOW_CATEGORIES_COLLECTION_ID="categories_collection_id"
export WEBFLOW_TAGS_COLLECTION_ID="tags_collection_id"
```

Add to `.env`:

```env
WEBFLOW_API_TOKEN=xxxxx
WEBFLOW_SITE_ID=xxxxx
WEBFLOW_COLLECTION_ID=xxxxx
WEBFLOW_CATEGORIES_COLLECTION_ID=xxxxx
WEBFLOW_TAGS_COLLECTION_ID=xxxxx
WEBFLOW_WEBHOOK_SECRET=xxxxx  # optional
```

### 2. Set Up Webhook in Webflow

- Account Settings → Integrations → Webhooks
- Add: `https://yourdomain.com/webhooks/webflow`
- Trigger on: Collection Item Publish, Collection Item Update

### 3. Restart API

```bash
npm run build && npm start
```

### 4. Test Connection

```bash
curl http://localhost:3000/api/mcp/webflow/modules
```

---

## Common Tasks

### Sync All Supabase Modules to Webflow

```bash
curl -X POST http://localhost:3000/api/mcp/webflow/sync/push
```

**Response:**
```json
{
  "success": true,
  "data": {
    "direction": "push",
    "totalProcessed": 10,
    "successful": 10,
    "failed": 0,
    "conflicts": 0
  }
}
```

### Pull Latest from Webflow to Supabase

```bash
curl -X POST http://localhost:3000/api/mcp/webflow/sync/pull
```

**Response:**
```json
{
  "success": true,
  "data": {
    "direction": "pull",
    "totalProcessed": 5,
    "successful": 5,
    "failed": 0,
    "conflicts": 0
  }
}
```

### Check If Module Needs Syncing

```bash
curl http://localhost:3000/api/mcp/webflow/sync-status/my-module-slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slug": "my-module-slug",
    "inSupabase": true,
    "inWebflow": false,
    "needsSync": true,
    "supabaseUpdated": "2025-11-15T16:01:45.800596+00:00",
    "direction": "push"
  }
}
```

### Search Webflow for Modules

```bash
curl "http://localhost:3000/api/mcp/webflow/search?q=prompt"
```

---

## Sync Direction Logic

The system automatically determines which direction to sync:

| Scenario | Direction | Action |
|----------|-----------|--------|
| In Supabase only | `push` | Create in Webflow |
| In Webflow only | `pull` | Create in Supabase |
| In both, Webflow newer | `pull` | Update Supabase |
| In both, Supabase newer | `push` | Update Webflow |
| In both, same time | none | No sync needed |

---

## Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "source": "webflow",
  "count": 5
}
```

---

## Troubleshooting

### No modules returned?

1. Check credentials in `.env`
2. Verify Webflow modules are **published** (not draft)
3. Check collection IDs match Webflow

### Sync fails with 0 successful?

1. Verify `WEBFLOW_API_TOKEN` is valid
2. Ensure `WEBFLOW_COLLECTION_ID` is correct
3. Check Supabase has modules with `status = 'published'`
4. Review server logs for specific errors

### Webhook not triggering?

1. Test with `/webhooks/webflow/test` first
2. Check webhook URL is publicly accessible
3. Verify Webflow webhook is active
4. Check webhook secret if signature validation enabled

---

## Environment Variables Reference

```bash
# Required for any Webflow operations
WEBFLOW_API_TOKEN=your_api_token

# Required for sync operations
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=modules_collection_id

# Optional for categories/tags sync
WEBFLOW_CATEGORIES_COLLECTION_ID=categories_collection_id
WEBFLOW_TAGS_COLLECTION_ID=tags_collection_id

# Optional for webhook validation
WEBFLOW_WEBHOOK_SECRET=your_webhook_secret

# Existing required variables
SUPABASE_URL=https://your.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Files Modified/Created

**New Services:**
- `src/services/webflowDataService.ts` - Fetch from Webflow
- `src/services/syncService.ts` - Bidirectional sync logic

**New Routes:**
- `src/routes/webhooks.ts` - Webhook handling

**Extended:**
- `src/mcp/server.ts` - Added Webflow functions
- `src/routes/mcp.ts` - Added Webflow endpoints
- `src/index.ts` - Registered webhook routes

---

## Quick Test Suite

Run these commands in sequence to verify everything works:

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. Test Webflow read
curl http://localhost:3000/api/mcp/webflow/modules

# 3. Test sync status
curl http://localhost:3000/api/mcp/webflow/sync-status/system-prompt-template

# 4. Test push sync
curl -X POST http://localhost:3000/api/mcp/webflow/sync/push

# 5. Test webhook
curl -X POST http://localhost:3000/webhooks/webflow/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

All should return `"success": true`

---

## Next Steps

1. **Get Webflow credentials** from Account Settings
2. **Update `.env`** with credentials
3. **Restart the API**: `npm run build && npm start`
4. **Test a sync** with the commands above
5. **Set up webhooks** in Webflow project settings
6. **Monitor logs** as data syncs

---

See [WEBFLOW_MCP_INTEGRATION.md](./WEBFLOW_MCP_INTEGRATION.md) for full documentation.
