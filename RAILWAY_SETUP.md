# Railway Deployment Guide

This guide will help you deploy CurrentPrompt with the admin testing UI to Railway.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway
- API keys for:
  - Supabase (database + storage)
  - OpenRouter (AI agents)
  - OpenAI (embeddings)
  - fal.ai (optional - thumbnail generation)

## Deployment Steps

### 1. Create New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway will auto-detect it as a Node.js project

### 2. Configure Environment Variables

In the Railway dashboard, go to your project → Variables tab and add:

#### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# OpenRouter (for AI agents)
OPENROUTER_API_KEY=sk-or-v1-...

# Node Environment
NODE_ENV=production

# Frontend Admin Password
VITE_ADMIN_PASSWORD=your_secure_password_here
```

#### Optional Variables

```bash
# Webflow Integration (optional)
WEBFLOW_API_TOKEN=your_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=your_collection_id

# fal.ai (optional - thumbnail generation)
FAL_API_KEY=your_fal_key

# CORS (Railway will auto-configure)
ALLOWED_ORIGINS=https://your-railway-app.up.railway.app

# API Authentication (optional)
API_KEY=your_secure_api_key
```

### 3. Set Build & Start Commands

Railway should auto-detect these from `package.json`, but verify:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

These are already configured in `railway.json`.

### 4. Deploy

1. Railway will automatically deploy when you push to your main branch
2. Or manually trigger deployment from the Railway dashboard
3. Wait for build to complete (usually 3-5 minutes)

### 5. Access Your Application

Once deployed:

1. Railway will provide a URL like: `https://your-app.up.railway.app`
2. Visit the URL - you'll see the admin testing portal
3. Enter your admin password (set in `VITE_ADMIN_PASSWORD`)
4. Start testing!

## Build Process

Railway automatically runs:

```bash
# Install all dependencies
npm install

# Build backend TypeScript
tsc

# Install frontend dependencies and build
cd frontend && npm install && npm run build

# Start production server
NODE_ENV=production node dist/index.js
```

The built frontend (`frontend/dist`) is served by the Express backend in production mode.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (has admin access) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI agents |
| `VITE_ADMIN_PASSWORD` | Yes | Password to access admin testing portal |
| `NODE_ENV` | Yes | Set to `production` |
| `WEBFLOW_API_TOKEN` | No | Webflow API token for auto-publishing |
| `WEBFLOW_SITE_ID` | No | Webflow site ID |
| `WEBFLOW_COLLECTION_ID` | No | Webflow collection ID for modules |
| `FAL_API_KEY` | No | fal.ai API key for thumbnail generation |
| `ALLOWED_ORIGINS` | No | CORS origins (auto-configured by Railway) |
| `API_KEY` | No | Optional API authentication key |
| `PORT` | No | Auto-provided by Railway |

## Verifying Deployment

### 1. Check Health Endpoint

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Agent Health

```bash
curl https://your-app.up.railway.app/api/test-agents/health
```

Should return:
```json
{
  "status": "ok",
  "environment": {
    "openrouter": true,
    "openai": true,
    "supabase": true
  }
}
```

### 3. Test Admin Portal

1. Visit `https://your-app.up.railway.app`
2. You should see the password gate
3. Enter your password
4. Upload a test markdown file
5. View the agent results

## Troubleshooting

### Build Fails

- Check Railway logs for specific error
- Verify all dependencies are in `package.json`
- Ensure `frontend/package.json` exists and is valid

### 500 Errors on Startup

- Check environment variables are set correctly
- Verify Supabase credentials are valid
- Check Railway logs: `railway logs`

### Frontend Not Loading

- Verify `NODE_ENV=production` is set
- Check that `npm run build` completed successfully
- Ensure `frontend/dist` directory was created during build

### Agent Errors

- Verify `OPENROUTER_API_KEY` is valid
- Verify `OPENAI_API_KEY` is valid
- Check API key quotas/limits

## Database Setup

Make sure your Supabase database has the required tables. Run the migrations:

```sql
-- From migrations/001_create_schema.sql
-- From migrations/002_add_agent_fields.sql
```

These should already be applied if you've been using the system locally.

## Updating the App

To deploy updates:

1. Push changes to your GitHub repository
2. Railway will automatically detect and redeploy
3. Or manually trigger deployment from Railway dashboard

## Cost Estimates

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month + usage
- **Expected Usage**: ~$5-10/month for light use
- Additional costs:
  - Supabase: Free tier available
  - OpenRouter: Pay per token
  - OpenAI: Pay per token
  - fal.ai: Pay per image generated

## Security Notes

### Admin Portal
- Change `VITE_ADMIN_PASSWORD` from default
- Password is client-side only (suitable for personal use)
- For team use, implement proper backend authentication

### API Security
- Set `API_KEY` environment variable to enable API authentication
- Keep service role keys secure
- Don't expose in client-side code

### CORS
- Railway auto-configures CORS for your deployment URL
- Add custom domains to `ALLOWED_ORIGINS` if needed

## Next Steps

After deployment:

1. Test the admin portal with sample markdown
2. Verify agent outputs are correct
3. Test both "Test Only" and "Save to DB" modes
4. Monitor Railway logs for any issues
5. Set up custom domain (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: [GitHub Issues](https://github.com/automara/CurrentPrompt/issues)
