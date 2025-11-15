# Testing Guide - CurrentPrompt v2.0

**Webflow-First Architecture Testing**

This guide walks through testing the refactored v2.0 codebase.

---

## Prerequisites

### 1. Environment Setup

Create a `.env` file with your credentials:

```bash
cp .env.example .env
# Then edit .env with your actual credentials:
```

Required variables:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional (for full functionality):
```bash
WEBFLOW_API_TOKEN=your_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=your_collection_id
FAL_API_KEY=your_fal_key
WATCH_FOLDER=./uploads
```

### 2. Database Migration

Run the new migration in your Supabase SQL editor:

```sql
-- Run migrations/002_add_prd_fields.sql
```

This adds:
- `meta_description` column
- `owner` column (default: "Keith Armstrong")
- `webflow_id` column
- Updates search_text function

### 3. Install Dependencies

```bash
npm install
npm run build
```

---

## Test Plan

### ✅ Phase 1: Compilation & Type Safety

**Test:** TypeScript compiles without errors

```bash
npm run build
```

**Expected:** No compilation errors
**Status:** ✅ PASSING

---

### ✅ Phase 2: Server Startup

**Test:** API server starts successfully

```bash
npm start
```

**Expected output:**
```
✓ CurrentPrompt API v2.0 running on http://localhost:3000
✓ Architecture: Webflow-first automation pipeline
✓ Environment: development
```

**Requirements:** Valid `.env` file with Supabase credentials

**Test endpoints:**
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
```

**Expected responses:**
```json
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

---

### 📝 Phase 3: File Upload Endpoint

**Test:** Upload a markdown file via HTTP

```bash
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@uploads/test-module.md"
```

**Expected:**
```json
{
  "success": true,
  "message": "Module processed and synced to Webflow",
  "moduleId": "uuid-here"
}
```

**What it tests:**
- multer file upload
- Markdown file validation
- Ingestion pipeline
- Database insertion
- fal.ai thumbnail generation (if configured)
- Webflow sync (if configured)

**Known limitations (stub):**
- Mastra cleaning is simplified (uses regex extraction)
- Supabase Storage upload is mocked (returns placeholder paths)

---

### 📁 Phase 4: Folder Watcher

**Test:** Auto-process files dropped in uploads folder

```bash
# Terminal 1: Start watcher
npm run watch

# Terminal 2: Drop a file
cp test-content.md uploads/
```

**Expected output (Terminal 1):**
```
👀 Watching folder for uploads: ./uploads

📥 New markdown file detected: uploads/test-content.md
📝 Processing markdown file: uploads/test-content.md
✓ Module created: uuid-here
✓ Version 1 created with files
✓ Thumbnail generated: https://...
✓ Module synced to Webflow
✅ Successfully processed module: Test Content
   Module ID: uuid-here
```

**What it tests:**
- chokidar folder monitoring
- Automatic file detection
- End-to-end ingestion pipeline
- Same flow as HTTP upload

---

### 🔄 Phase 5: Webflow Sync

**Test:** Manually sync a module to Webflow

First, upload a module:
```bash
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@uploads/test-module.md"
# Note the returned moduleId
```

Then sync it:
```bash
curl -X POST http://localhost:3000/api/modules/sync/:moduleId
```

**Expected:**
```json
{
  "success": true,
  "message": "Module 'UX Debugger Skill' synced to Webflow"
}
```

**Requirements:**
- Valid Webflow credentials in `.env`
- Webflow collection created with matching schema

**What it tests:**
- Webflow API integration
- Module data transformation
- CMS item creation/update

---

### 📊 Phase 6: Module Retrieval

**Test:** Fetch modules from database

```bash
# List all modules
curl http://localhost:3000/api/modules

# Get specific module
curl http://localhost:3000/api/modules/ux-debugger-skill
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "UX Debugger Skill",
      "slug": "ux-debugger-skill",
      "category": "Claude Skills",
      "tags": ["UX", "debugging", "Claude", "web development"],
      "summary": "A comprehensive skill for identifying...",
      "meta_description": "Learn how to use the UX Debugger...",
      "owner": "Keith Armstrong",
      "latest_version": 1,
      "status": "published",
      "created_at": "2025-11-15T...",
      "updated_at": "2025-11-15T..."
    }
  ]
}
```

---

## Test Results Summary

| Component | Status | Notes |
|-----------|--------|-------|
| TypeScript Compilation | ✅ PASS | No errors |
| Database Migration | ⏳ MANUAL | Run migration 002 in Supabase |
| Server Startup | ⏳ NEEDS `.env` | Requires Supabase credentials |
| Upload Endpoint | ⏳ UNTESTED | Requires `.env` |
| Folder Watcher | ⏳ UNTESTED | Requires `.env` |
| Webflow Sync | ⏳ UNTESTED | Requires Webflow credentials |
| Module Retrieval | ⏳ UNTESTED | Requires `.env` |

---

## Known Issues & Limitations (v2.0)

### Stub Implementations

**1. Mastra Agent Integration** ⚠️
- Currently using regex-based metadata extraction
- TODO: Integrate actual Mastra workflow for content cleaning

**2. Supabase Storage Upload** ⚠️
- Returns placeholder file paths
- TODO: Implement actual file upload to Supabase Storage

**3. Summary Generation** ⚠️
- Simple truncation logic
- TODO: Use AI for intelligent summarization

**4. fal.ai Thumbnails** ⚠️
- Returns null if no API key
- Has fallback placeholder URLs by category
- TODO: Test with actual fal.ai API key

### Webflow Sync Issues

The Webflow v1 API has known limitations:
- Collection IDs from CMS UI may not work with v1 API
- May need to migrate to Webflow v2 API
- See `src/services/webflowService.ts` for details

---

## Next Steps for Full Implementation

### Phase 1 Completion Checklist

- [ ] Set up `.env` with valid credentials
- [ ] Run migration 002 in Supabase
- [ ] Test upload endpoint with real module
- [ ] Test folder watcher
- [ ] Verify database records created correctly
- [ ] Configure Webflow collection
- [ ] Test Webflow sync

### Phase 2: Production Features

- [ ] Implement Mastra agent integration
- [ ] Implement Supabase Storage upload
- [ ] Add fal.ai thumbnail generation
- [ ] Create intelligent summary generation
- [ ] Add error handling and retry logic
- [ ] Add logging and monitoring

### Phase 3: Deployment

- [ ] Deploy to Railway
- [ ] Configure environment variables
- [ ] Set up domain (if applicable)
- [ ] Test production deployment
- [ ] Publish initial 20 modules

---

## Troubleshooting

### Server won't start
- Check `.env` file exists
- Verify Supabase credentials are correct
- Run `npm run build` first

### Upload fails
- Check file is `.md` format
- Check file size < 10MB
- Verify Supabase connection

### Folder watcher not detecting files
- Check `WATCH_FOLDER` path in `.env`
- Ensure folder exists: `mkdir -p uploads`
- Check file permissions

### Webflow sync fails
- Verify Webflow API token is valid
- Check collection ID is correct (may need database ID, not CMS ID)
- See Webflow service warnings in console

---

**Ready to test?** Start with Phase 1 (compilation) and work through each phase sequentially.
