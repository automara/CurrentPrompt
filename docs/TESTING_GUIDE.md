# Testing Guide: CurrentPrompt Webflow Integration

This guide walks through testing the full flow: CSV → Webflow → API → Sync Back

## Prerequisites

1. ✅ CurrentPrompt API running (`npm start`)
2. ✅ Supabase project configured
3. Webflow site created (if not, see WEBFLOW_SETUP.md)
4. Webflow CMS collection created with fields
5. Webflow API credentials set in `.env`

## Phase 1: Import Sample Data to Webflow

### Step 1: Prepare CSV Import

We've created two CSV files for you:

- **`data/webflow_import.csv`** - Ready for Webflow import
- **`data/modules_sample.csv`** - Alternative format

### Step 2: Import into Webflow CMS

1. Go to your Webflow project dashboard
2. Open **CMS** → **modules** collection
3. Click **Import items**
4. Upload `data/webflow_import.csv`
5. Map CSV columns to CMS fields:
   - `Name` → `Name`
   - `Slug` → `Slug`
   - `Summary` → `Summary`
   - `Category` → `Category`
   - `Tags` → `Tags`
   - `Latest Version` → `Latest Version`
   - `Status` → `Status`
   - `Source URL` → `Source URL`
   - `Source Label` → `Source Label`
6. Click **Import**

✅ Modules now in Webflow CMS!

---

## Phase 2: Seed Supabase with Sample Data

### Step 1: Insert Modules via API

Create the modules in Supabase by calling the API:

```bash
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Prompt Template",
    "slug": "system-prompt-template",
    "category": "prompting",
    "tags": ["templates", "system", "beginner"],
    "summary": "A flexible template for creating effective system prompts for AI assistants",
    "status": "published"
  }'
```

Or use the Node.js script below:

```javascript
// scripts/seed-modules.js
const modules = [
  {
    title: "System Prompt Template",
    slug: "system-prompt-template",
    category: "prompting",
    tags: ["templates", "system", "beginner"],
    summary: "A flexible template for creating effective system prompts",
    status: "published"
  },
  // ... more modules
];

for (const module of modules) {
  await fetch("http://localhost:3000/api/modules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(module)
  });
}
```

✅ Modules now in Supabase!

---

## Phase 3: Test API Endpoints

### List All Modules
```bash
curl http://localhost:3000/api/modules
```

Expected: Returns all published modules from Supabase

### Search Modules
```bash
curl "http://localhost:3000/api/modules/search?q=system"
```

Expected: Returns modules matching "system"

### Get Specific Module
```bash
curl http://localhost:3000/api/modules/system-prompt-template
```

Expected: Returns module metadata

### Get MCP Stats
```bash
curl http://localhost:3000/api/mcp/stats
```

Expected:
```json
{
  "success": true,
  "data": {
    "totalModules": 10,
    "publishedModules": 7,
    "draftModules": 3,
    "categories": 5,
    "totalVersions": 10
  }
}
```

---

## Phase 4: Test Webflow Sync

### Sync Single Module to Webflow

First, get a module ID from Supabase:

```bash
curl http://localhost:3000/api/modules/system-prompt-template \
  | grep '"id"' | head -1
```

Then sync:

```bash
curl -X POST "http://localhost:3000/api/webflow/sync/{MODULE_ID}" \
  -H "Content-Type: application/json"
```

Expected:
```json
{
  "success": true,
  "message": "Module 'System Prompt Template' synced to Webflow"
}
```

Check your Webflow CMS - the module should update with latest data!

### Sync All Modules

```bash
curl -X POST http://localhost:3000/api/webflow/sync-all \
  -H "Content-Type: application/json"
```

Expected:
```json
{
  "success": true,
  "message": "Synced 10 modules to Webflow",
  "synced": 10,
  "failed": 0,
  "total": 10
}
```

---

## Phase 5: Test Full Round Trip

### Scenario: Create → Sync → Verify

**Step 1:** Create a new module in Supabase
```bash
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Test Module",
    "slug": "new-test-module",
    "category": "testing",
    "tags": ["test"],
    "summary": "Testing the round trip",
    "status": "published"
  }'
```

Capture the `id` from response.

**Step 2:** Sync to Webflow
```bash
curl -X POST "http://localhost:3000/api/webflow/sync/{ID}" \
  -H "Content-Type: application/json"
```

**Step 3:** Verify in Webflow CMS
- Go to Webflow → CMS → modules
- Should see "New Test Module" in the collection
- All fields populated correctly

**Step 4:** Verify via MCP API
```bash
curl "http://localhost:3000/api/mcp/modules/new-test-module"
```

---

## Phase 6: Test Download Links

### Verify File URLs

Each module should have download links to Supabase Storage files:

In Webflow CMS, each module should show:
- Download Full Markdown
- Download Summary Markdown
- Download ZIP Bundle

These URLs should be:
```
https://{SUPABASE_URL}/storage/v1/object/public/modules/{slug}/v{version}/full.md
https://{SUPABASE_URL}/storage/v1/object/public/modules/{slug}/v{version}/summary.md
https://{SUPABASE_URL}/storage/v1/object/public/modules/{slug}/v{version}/bundle.zip
```

---

## Troubleshooting

### Sync Returns "Failed to sync"

**Check:**
1. Webflow API token valid?
   ```bash
   echo $WEBFLOW_API_TOKEN
   ```

2. Webflow credentials in `.env`?
   ```bash
   cat .env | grep WEBFLOW
   ```

3. Webflow collection exists?
   - Go to Webflow CMS, check modules collection exists

4. API logs:
   ```bash
   npm start  # Check console for errors
   ```

### Module Not Appearing in Webflow

**Check:**
1. Module status is "published" (not draft/archived)
2. Sync endpoint returned success
3. Wait a moment - Webflow may take 1-2 seconds

### CSV Import Fails

**Check:**
1. Column names match exactly
2. All required fields present (Name, Slug, Category)
3. No special characters in values

---

## Testing Checklist

- [ ] CSV data imported to Webflow
- [ ] Sample modules created in Supabase
- [ ] API endpoints returning data
- [ ] MCP endpoints working
- [ ] Single module sync successful
- [ ] Bulk sync successful
- [ ] Module appears in Webflow CMS
- [ ] Download links valid
- [ ] Search working
- [ ] Category filtering working
- [ ] Tag filtering working

---

## Next Steps

Once testing is complete:

1. **Set up file uploads** to Supabase Storage (PHASE 3)
2. **Build Mastra ingestion workflow** (PHASE 3)
3. **Deploy to production**
4. **Set up webhook automation**

---

**Questions?** Check the relevant docs:
- WEBFLOW_SETUP.md - Webflow configuration
- MCP_GUIDE.md - Agent integration
- PRD.md - Architecture overview
