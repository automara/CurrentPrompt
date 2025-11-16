# Supabase Storage Bucket Setup Guide

## Quick Verification Checklist

### Step 1: Check Bucket Exists and is Public

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fhuocowvfrwjygxgzelw`
3. Navigate to **Storage** in the left sidebar
4. Look for bucket named `modules`

**Expected:**
- ✅ Bucket `modules` exists
- ✅ "Public" toggle is **ON** (green)

**If bucket doesn't exist:**
- The code will create it automatically on server startup
- Check server logs for: `✓ Created storage bucket: modules`

**If bucket is private:**
- Click on the bucket
- Toggle "Public" to ON
- Confirm the change

---

### Step 2: Verify RLS Policies

Even public buckets need Row Level Security (RLS) policies for proper access.

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Look for policies on the `storage.objects` table for bucket `modules`

**Required Policies:**

#### Policy 1: Public Read Access
```sql
-- Allow anyone to read files from modules bucket
CREATE POLICY "Public read access to modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');
```

#### Policy 2: Service Role Full Access
```sql
-- Allow service role to upload/update/delete files
CREATE POLICY "Service role full access to modules"
ON storage.objects FOR ALL
USING (
  bucket_id = 'modules'
  AND auth.role() = 'service_role'
);
```

**To add policies:**
1. Go to **SQL Editor** in Supabase Dashboard
2. Click "+ New query"
3. Paste the SQL above
4. Click "Run" or press Cmd/Ctrl + Enter

---

### Step 3: Test File Upload & Public Access

After deploying or running locally, test the upload:

```bash
# Upload a test file
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@test-module.md"

# Look for this in the response or logs:
# ✓ Uploaded: full.md → https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module/v1/full.md
```

**Test public URL access:**
```bash
# Copy the URL from the log and test it
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/test-module/v1/full.md

# Should return the markdown content
# If you get 404 or 403, check:
# 1. Bucket is public
# 2. RLS policies exist
# 3. File actually uploaded (check Supabase Storage browser)
```

---

### Step 4: Verify in Supabase Storage Browser

1. Go to **Storage** → `modules` bucket
2. Browse the folder structure:
   ```
   modules/
     ├── test-module/
     │   └── v1/
     │       ├── full.md
     │       ├── summary.md
     │       └── bundle.zip
   ```
3. Click on a file to preview it
4. Click "Get URL" to see the public URL
5. Try opening the URL in a new browser tab

**Expected:**
- ✅ Files are visible in the bucket
- ✅ Public URL opens the file directly
- ✅ No authentication required to access

---

## Troubleshooting

### Issue: Files Upload but URLs Return 404

**Cause:** Bucket is not marked as public or RLS policies are missing

**Fix:**
1. Toggle bucket to Public in Supabase Dashboard
2. Add RLS policies (see Step 2 above)
3. Wait 10-30 seconds for changes to propagate
4. Test URL again

### Issue: Upload Fails with Permission Error

**Cause:** Service role key is incorrect or not set

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in your `.env`
2. Get the correct key from Supabase Dashboard → Settings → API
3. Use the **service_role** key (NOT the anon key)
4. Restart the server

### Issue: Bucket Creation Fails

**Cause:** Insufficient permissions or bucket already exists

**Fix:**
1. Check server logs for specific error
2. Manually create bucket in Supabase Dashboard:
   - Go to Storage → "New bucket"
   - Name: `modules`
   - Public: ON
   - File size limit: 10MB
   - Allowed MIME types: `text/markdown,text/plain,application/zip,image/png,image/jpeg`

---

## Quick Test Commands

```bash
# Check if bucket exists and is public
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/bucket/modules

# Expected response includes: "public": true

# Upload test file
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@test-module.md"

# Test public URL (replace with actual URL from logs)
curl https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules/slug/v1/full.md

# List all files in bucket (requires service role key)
curl -X GET \
  'https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/list/modules' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Current Configuration

**Your settings (from code):**
- Bucket name: `modules`
- Public: `true`
- File size limit: `10485760` (10MB)
- Allowed MIME types: `text/markdown`, `text/plain`, `application/zip`, `image/png`, `image/jpeg`

**Folder structure:**
- `{slug}/v{version}/{filename}`
- Example: `ux-debugger-skill/v1/full.md`

**Public URL format:**
```
https://{project-id}.supabase.co/storage/v1/object/public/modules/{slug}/v{version}/{filename}
```

---

## Need Help?

If you're still having issues:

1. Check Supabase Dashboard → Logs → Storage logs
2. Check your server logs for upload errors
3. Verify bucket is public in Supabase Dashboard
4. Ensure RLS policies exist
5. Test with a small file first (< 1MB)

The code will automatically:
- Create the bucket if it doesn't exist
- Upload files with proper content types
- Generate public URLs
- Log errors clearly

✅ **Once bucket is public + RLS policies are set, everything should work automatically!**
