# Railway Deployment Checklist

## Required Environment Variables

For the content generation agents to work, you **MUST** set these in Railway:

### Essential (App Won't Start Without These)
```bash
SUPABASE_URL=https://fhuocowvfrwjygxgzelw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Required for Agents
```bash
OPENROUTER_API_KEY=your_openrouter_key     # ✅ Already set
OPENAI_API_KEY=your_openai_key             # ⚠️ MUST ADD for embeddings
```

### Optional (Features will be disabled if missing)
```bash
WEBFLOW_API_TOKEN=your_token
WEBFLOW_COLLECTION_ID=your_collection_id
FAL_API_KEY=your_fal_key
```

## ✅ RESOLVED: 502 Error Fixed

**Root Cause:** Custom `PORT=3000` variable was conflicting with Railway's auto-assigned port (8080).

**Solution:** Removed custom PORT variable from Railway. Railway now auto-injects the correct port via environment variable.

**Status:** ✅ App responding successfully on production URL
- Health endpoint: Working
- Agent health endpoint: All systems ready (OpenRouter ✅, OpenAI ✅, Supabase ✅)
- Agent workflow test: 100/100 quality score in 1.69 seconds

## How to Add Environment Variables in Railway

1. Go to your Railway project
2. Select the PR deployment (or main deployment)
3. Click "Variables" tab
4. Add the missing variables
5. Redeploy (Railway will auto-redeploy when you save variables)

## Testing After Deployment

Once environment variables are set:

```bash
# 1. Check health
curl https://currentprompt-currentprompt-pr-4.up.railway.app/health

# 2. Check agent health
curl https://currentprompt-currentprompt-pr-4.up.railway.app/api/test-agents/health

# Expected response:
# {
#   "status": "ok",
#   "agents": "ready",
#   "environment": {
#     "openrouter": true,
#     "openai": true,
#     "supabase": true
#   },
#   "ready": true
# }
```

## Node Version Warning

The build logs show warnings about Node 18 vs Node 20:
```
npm warn EBADENGINE package: '@mastra/core@0.24.1'
npm warn EBADENGINE required: { node: '>=20' }
npm warn EBADENGINE current: { node: 'v18.20.5' }
```

**This is NOT blocking** - Mastra will still work on Node 18, but you should upgrade to Node 20+ eventually.

To upgrade Node version in Railway, add a `nixpacks.toml` file:

```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]
```

## Quick Troubleshooting

### If still getting 502:
1. Check Railway logs (click "Deployments" → "View Logs")
2. Look for startup errors
3. Most common: `Missing Supabase credentials`

### If app starts but agents fail:
1. Check `/api/test-agents/health`
2. Ensure `openrouter: true` and `openai: true`
3. Check Railway logs for API errors

### If embeddings fail:
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API credits/quota

## Alternative: Merge to Main

If PR deployment continues having issues, merge to main:

```bash
gh pr merge 4 --squash
```

Then test on your main deployment URL instead.
