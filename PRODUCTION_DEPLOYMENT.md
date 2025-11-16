# Production Deployment Guide - CurrentPrompt

**Goal:** Deploy to Railway so files are hosted on Supabase and synced to Webflow CMS

**Status:** Code is production-ready ✅ - Just needs configuration & deployment

---

## Overview

Your system already has:
- ✅ File hosting via Supabase Storage
- ✅ Webflow v2 API integration
- ✅ 7 AI agents for content generation
- ✅ RESTful API with security hardening
- ✅ Railway deployment configuration

**What you need to do:**
1. Configure Supabase bucket (5 minutes)
2. Set up Webflow CMS collection (15 minutes)
3. Deploy to Railway (10 minutes)
4. Test production upload (5 minutes)

**Total time:** ~35 minutes

---

## Part 1: Supabase Storage Setup

### Step 1.1: Make Bucket Public

1. Go to https://supabase.com/dashboard
2. Select project: `fhuocowvfrwjygxgzelw`
3. Click **Storage** in left sidebar
4. Look for bucket named `modules`
   - If it doesn't exist, don't worry - the code creates it automatically on first deploy
   - If it exists, click on it and toggle **Public** to ON (green)

### Step 1.2: Add RLS Policies

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **+ New query**
3. Paste this SQL:

```sql
-- Allow anyone to read files from modules bucket
CREATE POLICY "Public read access to modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');

-- Allow service role to upload/update/delete files
CREATE POLICY "Service role full access to modules"
ON storage.objects FOR ALL
USING (
  bucket_id = 'modules'
  AND auth.role() = 'service_role'
);
```

4. Click **Run** (or press Cmd+Enter)
5. Verify success message appears

### Step 1.3: Get Your Service Role Key

1. Still in Supabase Dashboard
2. Go to **Settings** → **API**
3. Copy these values (you'll need them for Railway):
   - **Project URL:** (should be `https://fhuocowvfrwjygxgzelw.supabase.co`)
   - **service_role key:** (NOT the anon key - this is important!)

**✅ Supabase Setup Complete**

---

## Part 2: Webflow CMS Setup

### Step 2.1: Create or Verify Collection

1. Go to https://webflow.com/dashboard
2. Open your CurrentPrompt site (or create one if needed)
3. Go to **CMS** → **Collections**
4. Create a new collection named **"Modules"** with these fields:

| Field Name | Type | Required | Notes |
|-----------|------|----------|-------|
| Name | Plain Text | Yes | Auto-created (module title) |
| Slug | Slug | Yes | Auto-created (URL-friendly) |
| Summary | Plain Text | No | One-line description |
| Category | Plain Text | No | Module category |
| Tags | Plain Text | No | Semicolon-separated tags |
| Latest Version | Number | No | Version number (e.g., 1, 2, 3) |
| Status | Plain Text | No | "draft" or "published" |
| Source URL | Link | No | Attribution link |
| Source Label | Plain Text | No | Attribution text |
| Download Link Full | Link | No | Link to full.md |
| Download Link Summary | Link | No | Link to summary.md |
| Download Link Bundle | Link | No | Link to bundle.zip |
| Supabase ID | Plain Text | No | UUID for syncing |
| Meta Title | Plain Text | No | SEO title |
| Meta Description | Plain Text | No | SEO description |
| Quality Score | Number | No | 0-100 validation score |

**Note:** Field names must match exactly (case-sensitive)

### Step 2.2: Get Webflow API Credentials

1. In Webflow, click your profile → **Settings**
2. Go to **Workspace settings** → **Integrations**
3. Scroll to **API Access**
4. Click **Generate API token**
5. Name it: "CurrentPrompt Production"
6. Select scopes:
   - ✅ **CMS** → Read & Write
   - ✅ **Sites** → Read
7. Copy the token (you only see it once!)

### Step 2.3: Get Collection ID

**Option A: Via API (Recommended)**
```bash
# Get your site ID first
curl https://api.webflow.com/v2/sites \
  -H "Authorization: Bearer YOUR_WEBFLOW_TOKEN" \
  | jq '.sites[] | {id, displayName}'

# Then get collection ID
curl https://api.webflow.com/v2/sites/YOUR_SITE_ID/collections \
  -H "Authorization: Bearer YOUR_WEBFLOW_TOKEN" \
  | jq '.collections[] | select(.displayName == "Modules") | .id'
```

**Option B: Via Webflow Designer**
1. Open collection settings
2. Collection ID is in the URL or settings panel

**Save these values:**
- `WEBFLOW_API_TOKEN` (from Step 2.2)
- `WEBFLOW_SITE_ID` (from Step 2.3)
- `WEBFLOW_COLLECTION_ID` (from Step 2.3)

**✅ Webflow Setup Complete**

---

## Part 3: Get AI API Keys

### Step 3.1: OpenRouter API Key (Required)

1. Go to https://openrouter.ai
2. Sign up or log in
3. Go to **Keys** → **Create Key**
4. Copy the key (starts with `sk-or-v1-...`)

**Used for:** 7 AI agents (summary, SEO, category, tags, schema, image prompt, validator)

### Step 3.2: OpenAI API Key (Required)

1. Go to https://platform.openai.com
2. Click **API keys** → **Create new secret key**
3. Copy the key (starts with `sk-...`)

**Used for:** Vector embeddings (text-embedding-3-large)

### Step 3.3: fal.ai API Key (Optional)

1. Go to https://fal.ai
2. Sign up → Get API key from dashboard
3. Copy the key

**Used for:** Thumbnail generation (optional - system works without it)

**✅ API Keys Ready**

---

## Part 4: Deploy to Railway

### Step 4.1: Create Railway Account

1. Go to https://railway.app
2. Click **Start a New Project**
3. Sign in with GitHub (recommended for auto-deploy)
4. Authorize Railway to access your repositories

### Step 4.2: Create New Project

1. Click **+ New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository: `automara/CurrentPrompt` or similar
4. Select branch: `automara/webflow-production-pipeline` (or `main` after merge)
5. Click **Deploy Now**

### Step 4.3: Add Environment Variables

**CRITICAL:** Railway auto-detects Node.js and will start building immediately. Add these variables BEFORE it finishes:

1. In Railway Dashboard → Your Project → **Variables** tab
2. Click **+ New Variable** for each:

```bash
# Supabase (from Part 1)
SUPABASE_URL=https://fhuocowvfrwjygxgzelw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_1.3

# Webflow (from Part 2)
WEBFLOW_API_TOKEN=your_token_from_step_2.2
WEBFLOW_COLLECTION_ID=your_collection_id_from_step_2.3

# AI APIs (from Part 3)
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key

# Optional
FAL_API_KEY=your_fal_key  # Optional - leave blank if you don't have it

# Security (IMPORTANT for production)
API_KEY=choose_a_strong_random_key_here  # Use to authenticate API requests
ALLOWED_ORIGINS=*  # Change to your domain later: https://yoursite.com

# Application
NODE_ENV=production
```

**⚠️ DO NOT SET `PORT`** - Railway manages this automatically!

### Step 4.4: Verify Build Settings

Railway auto-detects these, but verify in **Settings** tab:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Builder:** Nixpacks
- **Restart Policy:** On failure

### Step 4.5: Monitor Deployment

1. Go to **Deployments** tab
2. Watch the build logs in real-time
3. Wait for these logs:

```
✓ Supabase Storage initialized
✓ CurrentPrompt API v2.0 running on http://localhost:XXXX
✓ Environment: production
```

4. Once you see "Build successful" and server starts, grab your URL from **Domains** section

**✅ Deployment Complete**

---

## Part 5: Test Production

### Step 5.1: Test Health Endpoint

```bash
# Replace with your actual Railway URL
export RAILWAY_URL="https://your-app.up.railway.app"

curl $RAILWAY_URL/health

# Expected: {"status":"ok","timestamp":"..."}
```

### Step 5.2: Upload Test Module

Create a simple test file:

```bash
cat > test-module.md << 'EOF'
# Test Module for CurrentPrompt

This is a test module to verify the production pipeline.

## Features

- File hosting on Supabase
- Webflow CMS integration
- AI-generated metadata

## Installation

Just download and use!
EOF
```

Upload it:

```bash
curl -X POST $RAILWAY_URL/api/modules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "title": "Test Module",
    "content": "'"$(cat test-module.md)"'",
    "attribution": {
      "url": "https://github.com/yourusername",
      "label": "Your Name"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Module created successfully",
  "module": {
    "id": "uuid-here",
    "title": "Test Module",
    "slug": "test-module",
    "status": "draft",
    "version": 1
  },
  "files": {
    "full": "https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module/v1/full.md",
    "summary": "https://...summary.md",
    "bundle": "https://...bundle.zip"
  },
  "webflow": {
    "synced": true,
    "itemId": "..."
  }
}
```

### Step 5.3: Verify File Hosting

Test the public URLs from the response:

```bash
# Test full.md file
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module/v1/full.md

# Should return the markdown content
# If you get 404 or 403, go back to Part 1 and verify bucket is public + RLS policies exist
```

### Step 5.4: Verify Webflow Sync

1. Go to Webflow CMS → **Modules** collection
2. Look for "Test Module"
3. Verify these fields are populated:
   - Title: "Test Module"
   - Summary: (AI-generated)
   - Category: (AI-detected)
   - Tags: (AI-generated, semicolon-separated)
   - Download links (all three should work)
   - Status: "draft"
   - Version: 1

4. Click each download link to verify they open the files

**✅ Production Test Complete**

---

## Part 6: Production Workflow

### How to Use in Production

**1. Upload via API:**
```bash
curl -X POST $RAILWAY_URL/api/modules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @module.json
```

**2. Files are automatically:**
- ✅ Processed by 7 AI agents (summary, SEO, category, tags, etc.)
- ✅ Uploaded to Supabase Storage (full.md, summary.md, bundle.zip)
- ✅ Synced to Webflow CMS as draft items
- ✅ Available via public URLs

**3. In Webflow:**
- Review the draft item in CMS
- Click download links to verify files
- Change status to "published" when ready
- Item appears on your live site

**4. To publish on your website:**
- Create a Collection List in Webflow Designer
- Filter by Status = "published"
- Bind download links to buttons
- Publish your site

### Available Endpoints

```bash
# Create module (JSON upload - RECOMMENDED)
POST /api/modules/create
Headers:
  - Content-Type: application/json
  - Authorization: Bearer YOUR_API_KEY
Body: {"title": "...", "content": "..."}

# List all published modules
GET /api/modules

# Get specific module
GET /api/modules/:slug

# Manual Webflow sync (if auto-sync fails)
POST /api/modules/sync/:id
Headers: Authorization: Bearer YOUR_API_KEY

# Health check
GET /health
```

### API Authentication

If you set `API_KEY` in Railway variables (recommended), include it in requests:

```bash
-H "Authorization: Bearer your_api_key_here"
```

To disable auth (NOT recommended for production), remove `API_KEY` variable from Railway.

---

## Part 7: Monitoring & Maintenance

### View Logs

**Railway Dashboard:**
1. Go to **Deployments** → Active deployment
2. Click **View Logs**
3. Filter by level (info, error, warn)

**Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway link
railway logs --follow
```

### Monitor Uploads

Watch for these log patterns:

**Success:**
```
✓ Module created: uuid-here
✓ Uploaded: full.md → https://...
✓ Files uploaded to Supabase Storage
✓ Module synced to Webflow
```

**Errors to watch for:**
```
✗ Supabase upload failed  → Check service role key
✗ Webflow sync failed     → Check API token & collection ID
✗ Agent processing failed → Check OpenRouter/OpenAI keys
```

### Set Up Monitoring

**Option 1: Railway Alerts**
1. Dashboard → Observability → Alerts
2. Configure:
   - CPU > 80% for 5 minutes
   - Memory > 400MB
   - Deployment failures

**Option 2: External Uptime Monitoring**
- UptimeRobot: https://uptimerobot.com (free)
- Monitor: `$RAILWAY_URL/health`
- Alert via email/Slack if down

---

## Troubleshooting

### Files upload but URLs return 404

**Cause:** Supabase bucket not public or RLS policies missing

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Verify bucket `modules` has **Public** toggle ON
3. Run RLS policy SQL from Part 1.2
4. Wait 30 seconds and test again

### Webflow sync fails

**Check Railway logs for error message:**

**Error: "Invalid API token"**
- Verify `WEBFLOW_API_TOKEN` in Railway variables
- Regenerate token if needed

**Error: "Collection not found"**
- Verify `WEBFLOW_COLLECTION_ID` matches your Modules collection
- Use API to get correct ID (see Part 2.3)

**Error: "Field not found: ..."**
- Collection fields don't match code expectations
- Add missing field in Webflow CMS (see Part 2.1)

### AI agents fail

**Error: "OpenRouter API error"**
- Verify `OPENROUTER_API_KEY` is correct
- Check account has credits: https://openrouter.ai/credits

**Error: "OpenAI embeddings failed"**
- Verify `OPENAI_API_KEY` is correct
- Check usage limits: https://platform.openai.com/usage

### Deployment fails

**Build errors:**
```bash
# Test locally first
npm run build

# Fix any TypeScript errors
# Commit and push again
```

**Start errors:**
- Check Railway logs for specific error
- Verify all required environment variables are set
- Ensure `PORT` is NOT set (Railway manages it)

---

## Quick Reference

### Environment Variables Checklist

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `WEBFLOW_API_TOKEN`
- [ ] `WEBFLOW_COLLECTION_ID`
- [ ] `OPENROUTER_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `FAL_API_KEY` (optional)
- [ ] `API_KEY` (for auth)
- [ ] `ALLOWED_ORIGINS` (for CORS)
- [ ] `NODE_ENV=production`
- [ ] **DO NOT SET** `PORT`

### Key URLs

- **Supabase Dashboard:** https://supabase.com/dashboard/project/fhuocowvfrwjygxgzelw
- **Railway Dashboard:** https://railway.app/dashboard
- **Webflow Dashboard:** https://webflow.com/dashboard
- **OpenRouter:** https://openrouter.ai/keys
- **OpenAI:** https://platform.openai.com/api-keys

### File URL Format

```
https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/{slug}/v{version}/{filename}

Examples:
- full.md:     /modules/test-module/v1/full.md
- summary.md:  /modules/test-module/v1/summary.md
- bundle.zip:  /modules/test-module/v1/bundle.zip
```

---

## Next Steps

### Immediate (after first successful deploy)
- [ ] Upload 3-5 real modules
- [ ] Verify all file URLs work
- [ ] Test Webflow CMS integration end-to-end
- [ ] Configure custom domain (e.g., api.currentprompt.com)
- [ ] Update `ALLOWED_ORIGINS` to your actual domain

### Short term (within a week)
- [ ] Set up Railway staging environment for testing
- [ ] Add error tracking (Sentry, Rollbar)
- [ ] Configure uptime monitoring
- [ ] Document your specific workflow

### Long term
- [ ] Create Webflow collection template page
- [ ] Add CDN for faster file downloads
- [ ] Implement webhook from Webflow → Railway
- [ ] Build admin dashboard for managing modules

---

## Success Checklist

After completing this guide, you should have:

- [x] Supabase bucket created and public
- [x] RLS policies configured for file access
- [x] Webflow CMS collection created with all fields
- [x] Railway project deployed and running
- [x] All environment variables configured
- [x] Test module uploaded successfully
- [x] Files hosted and accessible via public URLs
- [x] Webflow CMS item created automatically
- [x] Production API endpoint working

**You're ready to use CurrentPrompt in production! 🚀**

For detailed technical documentation, see:
- `RAILWAY_DEPLOYMENT.md` - Complete Railway deployment guide
- `SUPABASE_BUCKET_SETUP.md` - Supabase storage configuration
- `docs/WEBFLOW_SETUP.md` - Webflow CMS setup guide
