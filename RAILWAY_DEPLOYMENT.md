# Railway Deployment Guide for CurrentPrompt

**Version:** 2.0
**Last Updated:** 2025-11-15
**Deployment Time:** ~1.5-2 hours (first time)

---

## Prerequisites

Before deploying to Railway, ensure you have:

- [x] GitHub repository set up (automara/CurrentPrompt)
- [x] Railway account (sign up at https://railway.app)
- [x] All environment variables ready (from `.env`)
- [x] Supabase project configured
- [x] Webflow site & collection set up
- [x] OpenAI API key

---

## Part 1: Pre-Deployment Preparation (Already Complete ✅)

### 1.1 Code Changes
- ✅ Fixed PORT environment variable (`src/index.ts` now uses `process.env.PORT`)
- ✅ Created `railway.json` configuration file
- ✅ Set up `.env` symlink for local development
- ✅ Verified build works: `npm run build`

### 1.2 What's Ready for Railway
- ✅ TypeScript compiles successfully to `dist/`
- ✅ `package.json` has correct `build` and `start` scripts
- ✅ Server listens on dynamic PORT (Railway requirement)
- ✅ Restart policy configured in `railway.json`
- ✅ Supabase Storage initialization on startup

---

## Part 2: Railway Account & Project Setup

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with GitHub (recommended for auto-deploy)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

**Option A: Via Railway Dashboard (Recommended)**

1. Click **"+ New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: `automara/CurrentPrompt`
4. Select branch: `automara/mastra-content-gen` (or `main` after PR merge)
5. Click **"Deploy Now"**

**Option B: Via Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in project directory
cd /path/to/currentprompt/.conductor/luxembourg
railway init

# Link to existing project (if you created one in dashboard)
railway link

# Or create new project
railway up
```

### Step 3: Configure Project Settings

In Railway Dashboard → Your Project → Settings:

1. **Name:** `currentprompt` or `currentprompt-staging`
2. **Description:** "Automated markdown module publishing with Webflow CMS"
3. **Root Directory:** Leave empty (deploys from repo root)
   - If deploying from workspace, set to `.conductor/luxembourg`
4. **Watch Paths:** (Auto-detected, but verify)
   - `src/**`
   - `package.json`
   - `tsconfig.json`

### Step 4: Configure Build & Deploy

Railway should auto-detect Node.js, but verify:

**Build Settings:**
- **Builder:** NIXPACKS (auto-detected)
- **Build Command:** `npm run build`
- **Install Command:** `npm install`

**Deploy Settings:**
- **Start Command:** `npm start`
- **Restart Policy:** ON_FAILURE (from railway.json)

---

## Part 3: Environment Variables Configuration

### Step 1: Add Environment Variables

In Railway Dashboard → Your Project → Variables tab:

**Click "+ New Variable" and add each of these:**

#### Supabase Configuration
```bash
SUPABASE_URL=https://fhuocowvfrwjygxgzelw.supabase.co
SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_dashboard
```

#### Webflow Configuration
```bash
WEBFLOW_API_TOKEN=your_webflow_api_token
WEBFLOW_SITE_ID=your_webflow_site_id
WEBFLOW_COLLECTION_ID=your_webflow_collection_id
```

#### OpenAI Configuration
```bash
OPENAI_API_KEY=your_openai_api_key
```

#### fal.ai Configuration (Optional)
```bash
FAL_API_KEY=your_fal_api_key
```

#### Application Configuration
```bash
NODE_ENV=production
WATCH_FOLDER=./uploads
```

**⚠️ DO NOT SET `PORT`** - Railway manages this automatically!

### Step 2: Get Your API Keys

#### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `fhuocowvfrwjygxgzelw`
3. Go to **Settings** → **API**
4. Copy:
   - **URL:** Project URL
   - **anon/public key:** For client-side access (not needed for this project)
   - **service_role key:** For server-side access (⚠️ **USE THIS ONE**)

#### Webflow API Token
1. Go to [Webflow Dashboard](https://webflow.com/dashboard)
2. Click your profile → **Settings** → **Integrations**
3. Scroll to **API Access** → **Generate token**
4. Copy the token (you only see it once!)

#### Webflow Site & Collection IDs
```bash
# Get site ID
curl https://api.webflow.com/v2/sites \
  -H "Authorization: Bearer YOUR_WEBFLOW_TOKEN" \
  | jq '.sites[] | {id, name}'

# Get collection ID
curl https://api.webflow.com/v2/sites/YOUR_SITE_ID/collections \
  -H "Authorization: Bearer YOUR_WEBFLOW_TOKEN" \
  | jq '.collections[] | {id, displayName}'
```

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Click **API keys** in left sidebar
3. **Create new secret key**
4. Copy the key immediately

### Step 3: Verify Variables

In Railway Dashboard → Variables:
- You should see ~10-12 variables
- Click eye icon to verify values (don't expose service_role key!)
- **No `PORT` variable** (Railway injects this automatically)

---

## Part 4: First Deployment

### Step 1: Trigger Deployment

**Option A: Auto-deploy from Git Push (Recommended)**
```bash
# Make sure all changes are committed
git status

# If changes exist, commit them
git add .
git commit -m "chore: prepare for Railway deployment

- Fix PORT environment variable
- Add railway.json configuration
- Update .env management"

# Push to trigger Railway deployment
git push origin automara/mastra-content-gen
```

**Option B: Manual Deployment via CLI**
```bash
railway up
```

**Option C: Manual Deployment via Dashboard**
1. Go to Railway Dashboard → Your Project
2. Click **"Deploy"** button
3. Select branch to deploy

### Step 2: Monitor Deployment

**Watch build logs in real-time:**

1. Railway Dashboard → Deployments → Click active deployment
2. Watch for these stages:
   ```
   ⏳ Cloning repository...
   ⏳ Installing dependencies (npm install)
   ⏳ Running build command (npm run build)
   ⏳ Starting application (npm start)
   ```

**Expected logs:**
```
✓ Supabase Storage initialized
✓ CurrentPrompt API v2.0 running on http://localhost:3000
✓ Architecture: Webflow-first automation pipeline
✓ Environment: production
```

**Deployment timeline:**
- Install dependencies: 30-60 seconds
- TypeScript compilation: 10-20 seconds
- Server startup: 5 seconds
- **Total:** 1-2 minutes

### Step 3: Get Your Railway URL

After deployment succeeds:

1. Railway Dashboard → Your Project
2. Find **"Domains"** section
3. Copy your app URL: `https://currentprompt-production.up.railway.app`
   (Your actual URL will be different)

**Or via CLI:**
```bash
railway domain
```

---

## Part 5: Post-Deployment Testing

### Step 1: Test Health Endpoint

```bash
# Replace with your actual Railway URL
curl https://currentprompt-production.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-15T20:30:00.000Z"
}
```

### Step 2: Test API Info

```bash
curl https://currentprompt-production.up.railway.app/

# Expected response:
{
  "name": "CurrentPrompt API",
  "version": "2.0.0",
  "description": "Automated markdown module publishing system with Webflow CMS integration",
  "architecture": "Webflow-first",
  "endpoints": {
    "modules": "/api/modules",
    "upload": "/api/modules/upload",
    "sync": "/api/modules/sync/:id",
    "health": "/health"
  }
}
```

### Step 3: Test File Upload

```bash
# Upload your test markdown file
curl -X POST https://currentprompt-production.up.railway.app/api/modules/upload \
  -F "file=@test-module.md"

# Expected response:
{
  "success": true,
  "message": "Module processed and synced to Webflow",
  "moduleId": "uuid-here"
}
```

### Step 4: Verify Supabase Storage

**Check Railway logs for:**
```
📝 Processing markdown file: test-module.md
🤖 Using OpenAI to generate metadata for: Test Module
✓ Generated content metadata for: Test Module for CurrentPrompt
✓ Mastra generated: 5 tags, category: Guides
✓ Module created: uuid-here
📤 Uploading files to Supabase Storage...
✓ Uploaded: full.md → https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module-for-currentprompt/v1/full.md
✓ Uploaded: summary.md → https://...
✓ Uploaded: bundle.zip → https://...
✓ Files uploaded to Supabase Storage
✓ Version 1 created with files
✓ Module synced to Webflow
✅ Successfully processed module: Test Module for CurrentPrompt
```

**Test public URL:**
```bash
# Copy the URL from logs and test it
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module-for-currentprompt/v1/full.md

# Should return the full markdown content
# If 404, see SUPABASE_BUCKET_SETUP.md for troubleshooting
```

### Step 5: Verify in Webflow CMS

1. Go to your Webflow site CMS
2. Open the "Modules" collection
3. Look for the new module: "Test Module for CurrentPrompt"
4. Verify fields are populated:
   - Title
   - Summary
   - Download links (full, summary, bundle)
   - Status, version, etc.
5. Click download links to verify they work

---

## Part 6: Monitoring & Maintenance

### View Logs

**Railway Dashboard:**
1. Go to Deployments → Active deployment
2. Click **"View Logs"**
3. Filter by log level (info, error, warn)

**Railway CLI:**
```bash
# Real-time logs
railway logs

# Follow logs (like tail -f)
railway logs --follow

# Filter by service
railway logs --service web
```

### Monitor Metrics

**Railway Dashboard → Observability:**
- **CPU Usage:** Should be < 50% normally
- **Memory Usage:** Should be < 200MB
- **Network:** Monitor request/response times
- **Deployments:** Track success/failure rate

### Set Up Alerts (Optional)

**Railway Dashboard → Observability → Alerts:**
1. Click "+ New Alert"
2. Configure:
   - CPU > 80% for 5 minutes
   - Memory > 400MB for 5 minutes
   - Deployment failures
3. Set notification method (email, Slack, Discord)

### Health Checks

**Railway automatically monitors:**
- HTTP health checks on your exposed port
- Restart on failure (configured in railway.json)
- Auto-redeploy on git push

**You can also use external monitoring:**
- UptimeRobot (free): https://uptimerobot.com
- Pingdom
- Better Uptime

---

## Part 7: Troubleshooting

### Issue: Deployment Fails During Build

**Check build logs for:**
- TypeScript compilation errors
- Missing dependencies
- Incorrect build command

**Fix:**
1. Test locally: `npm run build`
2. Fix any TypeScript errors
3. Commit and push again

### Issue: Server Starts But Crashes Immediately

**Common causes:**
- Missing environment variables
- Supabase connection failure
- Port binding issues

**Fix:**
1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Ensure `PORT` is NOT set (Railway manages it)
4. Check Supabase URL and keys are correct

### Issue: File Upload Works But URLs Return 404

**Cause:** Supabase bucket not public or RLS policies missing

**Fix:**
See `SUPABASE_BUCKET_SETUP.md` for detailed steps:
1. Make bucket public in Supabase Dashboard
2. Add RLS policies for read access
3. Test URL again after 30 seconds

### Issue: Webflow Sync Fails

**Check Railway logs for:**
- Webflow API authentication errors
- Collection ID mismatches
- Field mapping issues

**Fix:**
1. Verify `WEBFLOW_API_TOKEN` is valid
2. Verify `WEBFLOW_COLLECTION_ID` matches your CMS collection
3. Check Webflow API status: https://developers.webflow.com/status

### Issue: OpenAI API Errors

**Common causes:**
- Invalid API key
- Rate limits exceeded
- Quota exhausted

**Fix:**
1. Verify `OPENAI_API_KEY` is correct
2. Check OpenAI usage: https://platform.openai.com/usage
3. Upgrade plan if needed or use fallback metadata (code handles this)

---

## Part 8: Next Steps After Deployment

### Immediate (First Week)

- [ ] Upload 3-5 test modules via Railway endpoint
- [ ] Verify all Supabase Storage URLs work from external browser
- [ ] Test Webflow CMS integration end-to-end
- [ ] Monitor logs for any errors
- [ ] Set up uptime monitoring

### Short Term (Next Month)

- [ ] Configure custom domain (e.g., api.currentprompt.com)
- [ ] Set up Railway PR environments for testing
- [ ] Add error tracking (Sentry, Rollbar)
- [ ] Implement caching for fal.ai thumbnails
- [ ] Add rate limiting for uploads

### Long Term

- [ ] Scale to handle more traffic
- [ ] Add CDN for faster file downloads
- [ ] Implement CI/CD pipeline with tests
- [ ] Add monitoring dashboards
- [ ] Optimize database queries

---

## Part 9: Railway Best Practices

### Environment Management

**Use Railway Environments:**
- **Staging:** Test new features before production
- **Production:** Stable, public-facing deployment

**Set up in Railway:**
1. Dashboard → Your Project → **+ New Environment**
2. Name: "staging" or "production"
3. Clone variables from existing environment
4. Deploy separate branches to each

### Cost Optimization

**Railway Pricing:**
- **Starter:** $5/month (500 hours)
- **Pro:** $20/month (2000 hours)

**Optimize costs:**
- Use sleep mode for staging environments (auto-sleep after inactivity)
- Monitor resource usage in Observability tab
- Scale up only when needed

### Security

**Best practices:**
- Never commit `.env` files to git
- Use Railway's secret storage for all API keys
- Rotate credentials regularly
- Enable 2FA on Railway account
- Audit access logs periodically

### Deployment Strategy

**Recommended workflow:**
```
1. Develop locally → Test locally
2. Commit to feature branch → Auto-deploy to staging
3. Test on staging → Verify all integrations
4. Merge to main → Auto-deploy to production
5. Monitor production → Roll back if issues
```

---

## Part 10: Quick Reference

### Essential Commands

```bash
# View logs
railway logs

# Redeploy current version
railway up

# Link local project to Railway
railway link

# List all projects
railway list

# Check deployment status
railway status

# Open Railway dashboard
railway open
```

### Essential URLs

- **Railway Dashboard:** https://railway.app/dashboard
- **Railway Docs:** https://docs.railway.app
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Webflow API Docs:** https://developers.webflow.com
- **OpenAI Platform:** https://platform.openai.com

### Support Resources

- **Railway Discord:** https://discord.gg/railway
- **Railway Community Forum:** https://community.railway.app
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** Create issue in your repo

---

## Deployment Checklist

### Pre-Deployment
- [x] Code changes committed
- [x] Local build successful
- [x] `.env` variables documented
- [x] `railway.json` created
- [x] PORT variable fixed

### Railway Setup
- [ ] Railway account created
- [ ] GitHub connected
- [ ] Project created from repo
- [ ] Environment variables added
- [ ] Build/deploy commands configured

### First Deployment
- [ ] Deployment triggered
- [ ] Build completed successfully
- [ ] Server started without errors
- [ ] Railway URL noted

### Testing
- [ ] Health endpoint responding
- [ ] API info endpoint working
- [ ] File upload succeeds
- [ ] Supabase URLs accessible
- [ ] Webflow sync working

### Production Ready
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Team documented deployment process
- [ ] Backup/rollback plan in place

---

**Ready to deploy!** 🚀

Follow the steps in order, and you'll have CurrentPrompt running on Railway in under 2 hours.

For detailed Supabase bucket setup, see `SUPABASE_BUCKET_SETUP.md`.

For troubleshooting, check Railway logs first, then consult the troubleshooting section above.
