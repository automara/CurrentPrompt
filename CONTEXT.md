# CurrentPrompt - Context Document

**Last Updated:** 2025-11-15
**Status:** Phases 1 & 2 Complete. Ready for Phase 2.5: Webflow MCP Integration & Testing

---

## 🎯 Current Mission

Test and validate the **Webflow ↔ Supabase connection** with live data sync.

### What You're About to Do
1. Set up Webflow site with 3 CMS collections (categories, tags, modules)
2. Import sample CSV data into Webflow
3. Configure Webflow API credentials
4. Test bidirectional sync: Webflow ↔ Supabase ↔ MCP
5. Verify download links work

---

## 📍 System Summary

### Architecture
```
Supabase (Source of Truth)
    ↓ (REST API)
Express API (localhost:3000)
    ├─ /api/modules (CRUD)
    ├─ /api/webflow (Sync)
    └─ /api/mcp (Agent Access)
    ↓ (Sync Service)
Webflow CMS (Public Site)
    ├─ categories (6 items)
    ├─ tags (18 items)
    └─ modules (10+ items with references)
```

### Key Technologies
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL + Storage)
- **CMS:** Webflow with Reference Fields
- **API:** REST endpoints for CRUD and sync
- **Agents:** MCP protocol for Claude/LLMs

---

## 🔑 Critical Credentials & URLs

### Supabase (Already Set Up)
```
URL:                    https://fhuocowvfrwjygxgzelw.supabase.co
Anon Key:               eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodW9jb3d2ZnJ3anlneGd6ZWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjAxOTAsImV4cCI6MjA3ODc5NjE5MH0.Dc2Js4vxkbU6LFyq7_L9piVCNxNIVHZWtvpAf--_1f0
Service Role Key:       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodW9jb3d2ZnJ3anlneGd6ZWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyMDE5MCwiZXhwIjoyMDc4Nzk2MTkwfQ.rqVABi7Bk9wDKu6_q1hxwzlcx8Fy1podd60JPR5RzMA
Storage Bucket:         modules
```

### Webflow (Needs Setup)
```
Site URL:               https://automara.webflow.io (or your domain)
API Token:              [GET FROM: Account Settings → API Access]
Site ID:                [GET FROM: Project Settings → API]
Collection IDs:         [GET AFTER: Creating collections]
  - categories:         [Will be provided in Webflow]
  - tags:               [Will be provided in Webflow]
  - modules:            [Will be provided in Webflow]
```

**Action:** After creating Webflow collections, add to `.env`:
```
WEBFLOW_API_TOKEN=your_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=modules_collection_id
```

### Express API (Running Locally)
```
Base URL:               http://localhost:3000
Health Check:           http://localhost:3000/health
Start Command:          npm start
Build Command:          npm run build
```

---

## 📂 Key Files & Locations

### Project Structure
```
currentprompt/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── lib/supabase.ts       # Supabase client + types
│   ├── services/
│   │   ├── moduleService.ts  # Module CRUD logic
│   │   └── webflowService.ts # Webflow sync logic
│   ├── routes/
│   │   ├── modules.ts        # /api/modules endpoints
│   │   ├── webflow.ts        # /api/webflow endpoints
│   │   └── mcp.ts            # /api/mcp endpoints
│   └── mcp/
│       └── server.ts         # MCP business logic
├── data/
│   ├── webflow_categories.csv        # 6 categories
│   ├── webflow_tags.csv              # 18 tags
│   ├── webflow_modules_with_refs.csv # 10 modules with reference links
│   └── webflow_import.csv            # Alternative flat format
├── docs/
│   ├── WEBFLOW_QUICK_START.md        # ⭐ START HERE (5 min setup)
│   ├── WEBFLOW_CMS_SCHEMA.md         # Detailed step-by-step
│   ├── WEBFLOW_SETUP.md              # Original guide
│   ├── TESTING_GUIDE.md              # Full testing workflow
│   ├── MCP_GUIDE.md                  # Agent integration
│   └── README.md                     # Docs index
├── .env                              # Your local credentials
├── .env.example                      # Template
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── PROJECT.md                        # Architecture & vision
├── PRD.md                            # Product requirements
├── README.md                         # Quick start
├── CURRENT_STATUS.md                 # What's done
└── CONTEXT.md                        # This file
```

---

## 🚀 Immediate Next Steps

### Phase 2.5: Webflow Setup & Testing (This Week)

#### Step 1: Set Up Webflow CMS (5 minutes)
See `docs/WEBFLOW_QUICK_START.md`
1. Create `categories` collection → import `data/webflow_categories.csv`
2. Create `tags` collection → import `data/webflow_tags.csv`
3. Create `modules` collection with reference fields → import `data/webflow_modules_with_refs.csv`

#### Step 2: Get Webflow API Credentials
1. Go to Webflow Account Settings → API Access
2. Create token: "CurrentPrompt Sync"
3. Copy: API Token, Site ID, Collection IDs (for categories, tags, modules)
4. Add to `.env` file

#### Step 3: Test API Connections
See `docs/TESTING_GUIDE.md`
```bash
# Test Supabase connection
curl http://localhost:3000/api/modules

# Test Webflow sync
curl -X POST http://localhost:3000/api/webflow/sync-all

# Test MCP endpoints
curl http://localhost:3000/api/mcp/modules
curl "http://localhost:3000/api/mcp/search?q=system"
```

#### Step 4: Verify Full Round Trip
1. Create module in Supabase (via API)
2. Sync to Webflow (via sync endpoint)
3. Check Webflow CMS - module should appear
4. Verify download links work
5. Check MCP endpoint returns it

---

## 📊 Data Schema

### Supabase Tables
```sql
modules
├── id (UUID)
├── title (text)
├── slug (text, unique)
├── category (text) ← Will reference categories in Webflow
├── tags (text[]) ← Will reference tags in Webflow
├── summary (text)
├── latest_version (int)
├── status (draft|published|archived)
├── source_url (text, nullable)
├── source_label (text, nullable)
├── search_text (tsvector)
└── created_at, updated_at

module_versions
├── id (UUID)
├── module_id (FK)
├── version (int)
├── changelog (text)
├── file_paths (JSON)
│   ├── full_md: "https://...storage.../full.md"
│   ├── summary_md: "https://...storage.../summary.md"
│   └── bundle_zip: "https://...storage.../bundle.zip"
└── created_at

module_embeddings
├── id (UUID)
├── module_id (FK)
├── embedding (vector)
└── created_at
```

### Webflow Collections (To Create)
```
categories (Reference Data)
├── Name (auto)
├── Slug (auto)
└── Description (Rich Text)
Items: Prompting, Research, Writing, Development, Productivity, Methodology

tags (Reference Data)
├── Name (auto)
├── Slug (auto)
└── Description (Rich Text)
Items: Templates, System, Beginner, Advanced, Framework, Best Practices, etc.

modules (Main Collection)
├── Name (auto)
├── Slug (auto)
├── Summary (Rich Text)
├── Category (Reference to categories) [single]
├── Tags (Multi-reference to tags) [multiple]
├── Latest Version (Number)
├── Status (Text)
├── Source URL (Link)
├── Source Label (Text)
├── Download Link Full (Link)
├── Download Link Summary (Link)
├── Download Link Bundle (Link)
└── Supabase ID (Text)
```

---

## 🔌 API Endpoints

### Module Management (`/api/modules`)
```
GET    /                    # List all published
POST   /                    # Create
GET    /:slug               # Get by slug
PUT    /:id                 # Update
DELETE /:id                 # Delete
GET    /search?q=query      # Full-text search
GET    /category/:category  # Filter by category
GET    /tag/:tag            # Filter by tag
```

### Webflow Sync (`/api/webflow`)
```
POST   /sync/:moduleId      # Sync single module
POST   /sync-all            # Sync all published modules
DELETE /delete/:slug        # Remove from Webflow
```

### MCP Endpoints (`/api/mcp`)
```
GET    /modules             # List all
GET    /modules/:slug       # Get module
GET    /modules/:slug/full  # With versions
GET    /modules/:slug/content # Get markdown content
GET    /search?q=query      # Search
GET    /categories          # List categories
GET    /categories/:cat     # Filter by category
GET    /tags                # List tags
GET    /tags/:tag           # Filter by tag
GET    /stats               # Statistics
```

---

## 📋 CSV Files

### webflow_categories.csv
```
6 items: Prompting, Research, Writing, Development, Productivity, Methodology
Columns: Name, Slug, Description
Usage: Import into categories collection
```

### webflow_tags.csv
```
18 items: Templates, System, Beginner, Advanced, Framework, Best Practices, Tools, Strategy, Troubleshooting, Case Study, API, Design, Architecture, Testing, Customer, Organization, Knowledge, Meetings
Columns: Name, Slug, Description
Usage: Import into tags collection
```

### webflow_modules_with_refs.csv
```
10 sample modules with:
- Name, Slug, Summary
- Category (single value reference)
- Tags (semicolon-separated reference values)
- Version, Status, Attribution
- Download URLs pointing to Supabase Storage
Columns: Name, Slug, Summary, Category, Tags, Latest Version, Status, Source URL, Source Label, Download Link Full, Download Link Summary, Download Link Bundle
Usage: Import into modules collection
```

---

## 🧪 Testing Checklist

- [ ] Webflow site created
- [ ] 3 collections created (categories, tags, modules)
- [ ] CSV data imported to all collections
- [ ] Reference fields linking correctly
- [ ] Webflow API credentials obtained
- [ ] Credentials added to `.env`
- [ ] API server running (`npm start`)
- [ ] API endpoints responding
- [ ] Webflow sync working (`/api/webflow/sync-all`)
- [ ] Module appearing in Webflow after sync
- [ ] Download links valid
- [ ] MCP endpoints working
- [ ] Search functionality working

---

## 🔧 Troubleshooting Reference

### API Won't Start
```bash
npm run build
npm start
# Check for TypeScript errors
```

### Webflow Sync Fails
Check `.env` has valid credentials:
```
WEBFLOW_API_TOKEN=...
WEBFLOW_SITE_ID=...
WEBFLOW_COLLECTION_ID=...
```

### Reference Fields Not Linking
- Ensure category/tag names match exactly in CSV
- May need manual linking after import
- Check Webflow collection IDs are correct

### Download Links Not Working
- Ensure files exist in Supabase Storage at the paths specified
- Check URL format: `https://{project}.supabase.co/storage/v1/object/public/modules/{slug}/v{version}/{filename}`

---

## 📚 Documentation Map

| Need | File |
|------|------|
| Quick 5-min setup | `docs/WEBFLOW_QUICK_START.md` |
| Detailed steps | `docs/WEBFLOW_CMS_SCHEMA.md` |
| Full testing | `docs/TESTING_GUIDE.md` |
| Agent integration | `docs/MCP_GUIDE.md` |
| Architecture | `PROJECT.md` |
| Requirements | `PRD.md` |
| Status | `CURRENT_STATUS.md` |
| API reference | `docs/README.md` |
| Sample data | `data/README.md` |

---

## 🎯 Success Criteria (Phase 2.5)

✅ **Complete When:**
1. Webflow site fully configured with 3 collections
2. Sample data imported and reference fields linked
3. Webflow API credentials in `.env`
4. Sync endpoints working (modules push from Supabase → Webflow)
5. Download links verified working
6. All tests from TESTING_GUIDE.md passing
7. MCP endpoints responding with data from Webflow

✅ **Ready for Phase 3 When:**
All above complete + ready to build file upload endpoint

---

## 🚀 Phase Roadmap

- ✅ **Phase 1:** Foundation (Supabase + API)
- ✅ **Phase 2:** Webflow Integration (Sync service)
- 🔄 **Phase 2.5:** Webflow Testing & MCP Integration (CURRENT)
- ⏳ **Phase 3:** Ingestion Pipeline (File uploads + Mastra)
- ⏳ **Phase 4:** Semantic Search (Embeddings)
- ⏳ **Phase 5:** MCP Server (Standalone agent service)

---

## 💡 Key Insights

1. **Supabase is source of truth** - All data originates here
2. **Webflow is the public interface** - Users see this, content from Supabase
3. **Sync is one-directional (for now)** - Supabase → Webflow via API calls
4. **Reference fields maintain integrity** - Categories and tags are linked, not duplicated
5. **MCP enables agent access** - Claude and other LLMs can query the same data
6. **Download links in CSV** - No need to manually update URLs after sync

---

## 📞 When You Return

1. Read this file (you are here)
2. Check CURRENT_STATUS.md for latest progress
3. Follow the "Immediate Next Steps" section
4. Reference the "Documentation Map" for specific guides
5. Use the "Testing Checklist" to track progress

---

**Good luck with the Webflow integration! You've built the hard part (the API architecture). Now it's about connecting the pieces together. 🚀**
