# Production Deployment Checklist

**Goal:** Get CurrentPrompt running in production in ~35 minutes

**Status:** All code is ready - just configuration needed ✅

---

## Quick Links

- **Supabase:** https://supabase.com/dashboard/project/fhuocowvfrwjygxgzelw
- **Railway:** https://railway.app/dashboard
- **Webflow:** https://webflow.com/dashboard
- **Full Guide:** See `PRODUCTION_DEPLOYMENT.md`

---

## Part 1: Supabase Storage (5 min)

### Task 1: Make bucket public
- [ ] Go to Supabase Dashboard → Storage
- [ ] Find or create `modules` bucket
- [ ] Toggle **Public** to ON

### Task 2: Add RLS policies
- [ ] Go to SQL Editor
- [ ] Run this SQL:
```sql
CREATE POLICY "Public read access to modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');

CREATE POLICY "Service role full access to modules"
ON storage.objects FOR ALL
USING (bucket_id = 'modules' AND auth.role() = 'service_role');
```

### Task 3: Get service role key
- [ ] Settings → API
- [ ] Copy **service_role key** (not anon key!)
- [ ] Save for Railway: `SUPABASE_SERVICE_ROLE_KEY=...`

---

## Part 2: Webflow CMS (15 min)

### Task 1: Create collection
- [ ] Go to Webflow → CMS → Collections
- [ ] Create **"Modules"** collection
- [ ] Add these fields (all Plain Text except where noted):
  - [ ] Name (auto-created)
  - [ ] Slug (auto-created, type: Slug)
  - [ ] Summary
  - [ ] Category
  - [ ] Tags
  - [ ] Latest Version (type: Number)
  - [ ] Status
  - [ ] Source URL (type: Link)
  - [ ] Source Label
  - [ ] Download Link Full (type: Link)
  - [ ] Download Link Summary (type: Link)
  - [ ] Download Link Bundle (type: Link)
  - [ ] Supabase ID
  - [ ] Meta Title
  - [ ] Meta Description
  - [ ] Quality Score (type: Number)

### Task 2: Get API token
- [ ] Profile → Settings → Integrations → API Access
- [ ] Generate token with CMS read/write scope
- [ ] Copy token: `WEBFLOW_API_TOKEN=...`

### Task 3: Get collection ID
```bash
# Run this to get your collection ID:
curl https://api.webflow.com/v2/sites \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.sites[] | .id'

# Then get collection ID:
curl https://api.webflow.com/v2/sites/SITE_ID/collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.collections[] | select(.displayName == "Modules") | .id'
```
- [ ] Save collection ID: `WEBFLOW_COLLECTION_ID=...`

---

## Part 3: AI API Keys (5 min)

### OpenRouter (required)
- [ ] Go to https://openrouter.ai/keys
- [ ] Create key
- [ ] Save: `OPENROUTER_API_KEY=sk-or-v1-...`

### OpenAI (required)
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Create key
- [ ] Save: `OPENAI_API_KEY=sk-...`

### fal.ai (optional)
- [ ] Go to https://fal.ai (or skip if you don't need thumbnails)
- [ ] Save: `FAL_API_KEY=...`

---

## Part 4: Railway Deployment (10 min)

### Task 1: Create project
- [ ] Go to https://railway.app
- [ ] Sign in with GitHub
- [ ] New Project → Deploy from GitHub repo
- [ ] Select your repo and branch: `automara/webflow-production-pipeline`
- [ ] Click Deploy

### Task 2: Add environment variables
Go to Variables tab and add each:

```bash
# Required
SUPABASE_URL=https://fhuocowvfrwjygxgzelw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
WEBFLOW_API_TOKEN=...
WEBFLOW_COLLECTION_ID=...
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...

# Security
API_KEY=choose_a_strong_random_key
ALLOWED_ORIGINS=*

# Config
NODE_ENV=production
```

**DO NOT SET `PORT`** - Railway handles this

- [ ] All variables added
- [ ] Deployment building/built successfully

### Task 3: Get Railway URL
- [ ] Go to Domains section
- [ ] Copy your URL: `https://....up.railway.app`
- [ ] Save as: `RAILWAY_URL=...`

---

## Part 5: Production Test (5 min)

### Test 1: Health check
```bash
curl https://your-app.up.railway.app/health
# Expected: {"status":"ok",...}
```
- [ ] Health check returns 200 OK

### Test 2: Upload module
```bash
export RAILWAY_URL="https://your-app.up.railway.app"
export API_KEY="your_api_key_from_railway"

curl -X POST $RAILWAY_URL/api/modules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "title": "Test Module",
    "content": "# Test\n\nThis is a test module.\n\n## Features\n\n- File hosting\n- Webflow sync\n- AI metadata",
    "attribution": {
      "url": "https://github.com/test",
      "label": "Test User"
    }
  }'
```
- [ ] Upload succeeds (returns 200 with module data)
- [ ] Response includes file URLs

### Test 3: Verify file hosting
```bash
# Copy the "full" URL from response and test it:
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module/v1/full.md
# Should return markdown content
```
- [ ] File URL returns content (not 404/403)
- [ ] Summary URL works
- [ ] Bundle URL works

### Test 4: Verify Webflow sync
- [ ] Go to Webflow CMS → Modules collection
- [ ] Find "Test Module" item
- [ ] Verify fields populated:
  - [ ] Title, Summary, Category, Tags
  - [ ] Download links (all three)
  - [ ] Status = "draft"
  - [ ] Version = 1
- [ ] Click download links to verify they work

---

## Production Ready Checklist ✅

After completing all above:

- [ ] Supabase bucket is public
- [ ] RLS policies configured
- [ ] Webflow collection created with all fields
- [ ] Railway deployed successfully
- [ ] All environment variables set
- [ ] Test upload successful
- [ ] Files accessible via public URLs
- [ ] Webflow CMS item created automatically
- [ ] API endpoint responding correctly

**You're live! 🚀**

---

## Next Steps

### Immediate
- [ ] Upload 3-5 real modules
- [ ] Update `ALLOWED_ORIGINS` to your actual domain
- [ ] Configure Railway custom domain (optional)

### Within a week
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Create Webflow template page for modules
- [ ] Document your specific workflow

### Longer term
- [ ] Build admin dashboard
- [ ] Add CDN for downloads
- [ ] Set up staging environment

---

## Common Issues & Quick Fixes

**File URLs return 404:**
→ Go back to Part 1, make sure bucket is public + RLS policies exist

**Webflow sync fails:**
→ Check Railway logs, verify `WEBFLOW_API_TOKEN` and `WEBFLOW_COLLECTION_ID`

**AI agents fail:**
→ Verify `OPENROUTER_API_KEY` and `OPENAI_API_KEY` are correct

**Build fails:**
→ Run `npm run build` locally, fix errors, push again

---

## Support

- **Full Guide:** `PRODUCTION_DEPLOYMENT.md`
- **Railway Docs:** `RAILWAY_DEPLOYMENT.md`
- **Supabase Setup:** `SUPABASE_BUCKET_SETUP.md`
- **Webflow Setup:** `docs/WEBFLOW_SETUP.md`

---

**Time estimate:** 35 minutes total
**Difficulty:** Easy (mostly copy-paste configuration)
**Code changes needed:** None - everything is ready!
