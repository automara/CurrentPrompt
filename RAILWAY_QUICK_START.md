# Railway Quick Start - Get Your URL

## Current Status: ✅ Deployed but Not Exposed

Your deployment shows **"Deployment successful"** but the service is **"Unexposed"** - this means it's running but not accessible from the internet.

---

## Fix: Generate a Public Domain (30 seconds)

### Step 1: Go to Settings Tab
In your Railway dashboard (where you are now):
- Click **"Settings"** tab (top right, next to Logs)

### Step 2: Find Networking Section
In Settings, scroll down to find:
- **"Networking"** section, or
- **"Domains"** section

### Step 3: Generate Domain
- Click **"Generate Domain"** button
- Railway will create a public URL like:
  ```
  https://currentprompt-production.up.railway.app
  ```
- Copy this URL!

---

## After Getting Your URL

### Test It Immediately

Once you have your Railway URL (let's say it's `https://your-app.railway.app`):

**1. Test Health Endpoint:**
```bash
curl https://your-app.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T..."
}
```

**2. Test API Info:**
```bash
curl https://your-app.railway.app/
```

**Expected response:**
```json
{
  "name": "CurrentPrompt API",
  "version": "2.0.0",
  "endpoints": {
    "modules": "/api/modules",
    "upload": "/api/modules/upload",
    ...
  }
}
```

**3. Check Logs:**
- Click **"Logs"** tab in Railway
- Look for:
  ```
  ✓ Supabase Storage initialized
  ✓ CurrentPrompt API v2.0 running on http://localhost:3000
  ✓ Architecture: Webflow-first automation pipeline
  ✓ Environment: production
  ```

---

## What to Look For in Logs

### ✅ Good Signs:
```
✓ Supabase Storage initialized
✓ CurrentPrompt API v2.0 running
✓ Storage bucket already exists: modules
```

### ⚠️ Warnings (OK for now):
```
⚠️ Webflow sync disabled: missing credentials
```
This is fine - it means Webflow variables might not be set yet.

### ❌ Errors to Fix:
```
Error: Missing Supabase credentials
```
→ Go to **Variables** tab, add missing environment variables

```
Error: listen EADDRINUSE
```
→ Shouldn't happen on Railway (they manage ports)

---

## Next Steps After Getting URL

### 1. Test File Upload
```bash
curl -X POST https://your-app.railway.app/api/modules/upload \
  -F "file=@test-module.md"
```

### 2. Check Supabase Storage
- Go to Supabase Dashboard
- Storage → modules bucket
- Verify files are being uploaded

### 3. Verify Webflow Sync
- Check Webflow CMS for new module
- Test download links

---

## Common Issues

### Issue: "Generate Domain" Button Not Found

**Try this:**
1. Click on your **service** (CurrentPrompt) in the left sidebar
2. Go to **Settings** tab
3. Look for **"Public Networking"** section
4. Toggle **"Enable Public Networking"** if it exists

**Or:**
1. In the service overview, look for **"Add Domain"** or **"Networking"**
2. Click **"Generate Domain"**

### Issue: Domain Generated But Getting 404

**Check:**
1. Go to **Logs** tab - is the server actually running?
2. Look for port binding errors
3. Verify environment variables are set (Variables tab)

### Issue: Server Starts Then Crashes

**Check Logs for:**
- Missing environment variables
- Supabase connection errors
- Database/storage initialization failures

**Fix:**
1. Go to **Variables** tab
2. Verify all these are set:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY
   - WEBFLOW_API_TOKEN (optional)
   - WEBFLOW_COLLECTION_ID (optional)

---

## Visual Guide

### Where You Are Now:
```
Railway Dashboard → CurrentPrompt Service
├── Deployments (you're here ✓)
│   └── ACTIVE - Deployment successful
├── Variables (need to check)
├── Metrics
├── Settings (GO HERE NEXT →)
│   └── Networking/Domains
│       └── [Generate Domain] ← CLICK THIS
└── Logs
```

### What You Need to Do:
```
1. Settings → Networking → Generate Domain
2. Copy the URL
3. Test: curl https://your-url.railway.app/health
4. Share URL with me so I can verify!
```

---

## Quick Checklist

- [x] Deployed to Railway ✅
- [x] Build successful ✅
- [x] Service running ✅
- [ ] Public domain generated ← YOU ARE HERE
- [ ] Health endpoint tested
- [ ] Environment variables verified
- [ ] First file uploaded
- [ ] Supabase URLs working

---

## Need Help?

**If you can't find "Generate Domain":**
1. Take a screenshot of your Settings tab
2. I'll help you locate it

**If domain is generated but not working:**
1. Share the URL
2. Share logs from the Logs tab
3. We'll debug together

---

## Expected Timeline

- **Generate domain:** 10 seconds
- **Test health endpoint:** 5 seconds
- **Verify it's working:** 30 seconds
- **Total:** Less than 1 minute!

You're almost there! 🚀
