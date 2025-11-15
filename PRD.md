# CurrentPrompt – Product Requirements Document (PRD)

**Version:** 2.0 (Simplified)
**Last Updated:** 2025-11-15
**Status:** Ready for Implementation

---

## 1. Overview

**CurrentPrompt** is Keith's personal knowledge module platform—a curated feed of markdown-based resources including Claude Skills, PRDs, research papers, and professional tools. It's designed as a simple, automated publishing system that transforms local markdown files into a polished Webflow-hosted library.

**Core Philosophy:**
- **Personal first** – Keith's curated collection (starting with ~20 modules)
- **Automation over manual work** – Upload folder → published module
- **Webflow-centric** – CMS as the primary interface, not an API layer
- **Quality over quantity** – Thoughtful curation, professional presentation

---

## 2. Vision & Goals

### Primary Goals
1. **Effortless publishing** – Drop MD file in folder → live on Webflow
2. **Professional presentation** – Auto-generated images, summaries, SEO metadata
3. **Multiple formats** – Full MD, summary MD, ZIP downloads, copy-to-clipboard
4. **Future-ready** – Built for search, MCP integration, and expansion

### Success Metrics
- ✅ 20 modules published and live on Webflow
- ✅ Automated ingestion pipeline working (folder → Webflow)
- ✅ Each module has: summary, changelog, downloads, thumbnail image
- ✅ Clean, professional module pages with proper SEO

---

## 3. User Experience

### Content Structure
Each module includes:
- **Name:** e.g., "UX Debugger Skill (v.2)"
- **Thumbnail:** Auto-generated image (fal.ai)
- **Summary:** AI-generated overview
- **Category:** Single primary category
- **Tags:** Multiple tags for discovery
- **Downloads:** Full MD, Summary MD, ZIP bundle
- **Copy Button:** Copy markdown to clipboard
- **Changelog:** Version history
- **Metadata:** Date published, last updated, owner attribution

### User Flow
1. **Browse:** User visits Webflow site, sees feed of module cards
2. **Click:** Opens individual module CMS page
3. **Read:** Views summary, changelog, metadata
4. **Download:** Clicks download button (full/summary/ZIP) or copies code
5. **Use:** Integrates module into their workflow

---

## 4. Technical Architecture

### Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend/CMS** | Webflow | Primary interface, module hosting, public-facing site |
| **Database** | Supabase (PostgreSQL) | Module metadata, version history, embeddings |
| **Storage** | Supabase Storage | File hosting (MD, ZIP files) |
| **Ingestion** | Mastra Agents | Content cleaning, summary generation, metadata extraction |
| **Images** | fal.ai | Thumbnail generation |
| **API** | Express (Node.js) | Simple REST endpoints for Webflow sync |
| **Deployment** | Railway | Backend hosting |
| **Version Control** | GitHub | Code repository |

### Data Flow
```
Local Folder (MD files)
    ↓
Mastra Agent (cleaning, metadata extraction)
    ↓
Supabase (store metadata + files)
    ↓
fal.ai (generate thumbnail)
    ↓
REST API (sync to Webflow)
    ↓
Webflow CMS (published module)
```

---

## 5. Core Components

### 5.1 Local Folder Monitoring
**Purpose:** Watch a designated folder for new MD files

**Functionality:**
- Monitor `~/CurrentPrompt/uploads/` folder
- Detect new `.md` files
- Trigger ingestion pipeline on file add
- Support for bulk uploads (process multiple files)

**Technical Approach:**
- Node.js `chokidar` or `fs.watch`
- Simple file watcher script
- Trigger Mastra workflow on file detection

---

### 5.2 Mastra Cleaning Agent
**Purpose:** Transform raw markdown into structured, optimized module

**Input:** Raw markdown file

**Processing:**
1. **Content Analysis:**
   - Extract title (from filename or first H1)
   - Analyze content structure
   - Identify key concepts

2. **Generate Metadata:**
   - **Title:** Clean, professional title
   - **Summary:** 2-3 sentence overview (150-200 chars)
   - **SEO Schema:** Meta description, keywords
   - **Category:** Auto-categorize (or suggest to Keith)
   - **Tags:** Extract 3-5 relevant tags
   - **Date:** Capture upload date

3. **Create Versions:**
   - **Full MD:** Original content (cleaned formatting)
   - **Summary MD:** Condensed version (key points only)
   - **Changelog:** "Initial version" or version notes

4. **Generate Output:**
   - JSON object with all metadata
   - File paths for uploads
   - Structured data ready for Supabase

**Output:**
```json
{
  "title": "UX Debugger Skill",
  "slug": "ux-debugger-skill",
  "summary": "A comprehensive Claude skill for identifying and resolving UX issues in web applications.",
  "category": "Claude Skills",
  "tags": ["UX", "debugging", "Claude", "web development"],
  "meta_description": "Learn how to use the UX Debugger skill...",
  "version": 1,
  "changelog": "Initial release",
  "files": {
    "full": "path/to/full.md",
    "summary": "path/to/summary.md",
    "zip": "path/to/bundle.zip"
  }
}
```

---

### 5.3 Supabase Storage & Database
**Purpose:** Persist module data and files

**Database Schema:**

#### `modules` table
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  meta_description TEXT,
  source_url TEXT,
  source_label TEXT,
  owner TEXT DEFAULT 'Keith Armstrong',
  latest_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'published',
  webflow_id TEXT, -- Webflow CMS item ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `module_versions` table
```sql
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changelog TEXT,
  file_paths JSON, -- { full, summary, zip, thumbnail }
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, version)
);
```

#### `module_embeddings` table (future)
```sql
CREATE TABLE module_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Structure:**
```
supabase-storage/modules/
  ├── ux-debugger-skill/
  │   ├── v1/
  │   │   ├── full.md
  │   │   ├── summary.md
  │   │   ├── bundle.zip
  │   │   └── thumbnail.png
  │   └── v2/
  │       ├── full.md
  │       ├── summary.md
  │       ├── bundle.zip
  │       └── thumbnail.png
```

---

### 5.4 fal.ai Image Generation
**Purpose:** Auto-generate professional thumbnail images for each module

**Workflow:**
1. After Mastra generates metadata, extract title + category
2. Call fal.ai API with prompt:
   ```
   Create a minimalist, professional thumbnail for a knowledge module titled "{title}"
   in the category "{category}". Style: clean, modern, gradient background,
   centered icon or typography, 1200x630px, suitable for web display.
   ```
3. Store generated image in Supabase Storage
4. Add image URL to `module_versions.file_paths.thumbnail`

**Integration:**
- Use fal.ai text-to-image model (e.g., `fal-ai/fast-sdxl`)
- Fallback: Default category-based thumbnails if generation fails
- Cache: Reuse thumbnails for minor version updates

---

### 5.5 REST API (Webflow Sync)
**Purpose:** Simple API to push module data to Webflow CMS

**Endpoints:**

```
POST /api/modules/sync/:id
- Syncs specific module to Webflow
- Creates or updates CMS item
- Returns Webflow item ID

POST /api/modules/sync-all
- Bulk sync all modules
- Used for initial migration

GET /api/modules
- List all modules (for debugging)

GET /api/modules/:slug
- Get module details + download URLs
```

**Webflow Sync Logic:**
1. Fetch module data from Supabase
2. Transform to Webflow CMS schema
3. Call Webflow API (create or update collection item)
4. Store `webflow_id` back in Supabase
5. Return success/failure

**Webflow Collection Schema:**
- **Name:** `Modules`
- **Fields:**
  - `title` (Plain Text)
  - `slug` (Plain Text, unique)
  - `summary` (Plain Text)
  - `category` (Reference to Categories collection)
  - `tags` (Multi-reference to Tags collection)
  - `thumbnail` (Image)
  - `full-download-url` (Plain Text)
  - `summary-download-url` (Plain Text)
  - `zip-download-url` (Plain Text)
  - `markdown-content` (Rich Text - for copy button)
  - `changelog` (Rich Text)
  - `version` (Number)
  - `published-date` (Date)
  - `updated-date` (Date)
  - `owner` (Plain Text)

---

### 5.6 Source Attribution System
**Purpose:** Track and display module ownership/origin

**Fields in Database:**
- `owner` (default: "Keith Armstrong")
- `source_url` (optional: link to original if adapted)
- `source_label` (optional: "Adapted from..." or "Inspired by...")

**Display on Webflow:**
- Footer of each module page shows: "Created by {owner}"
- If `source_url` exists, show: "Adapted from {source_label}"

---

## 6. Implementation Phases

### Phase 1: Core Pipeline (Week 1-2)
**Goal:** End-to-end automation (folder → Webflow)

**Deliverables:**
- ✅ Folder monitoring script
- ✅ Mastra ingestion workflow
- ✅ Supabase schema + storage setup
- ✅ Basic REST API for Webflow sync
- ✅ Manual Webflow collection setup
- ✅ Test with 3-5 sample modules

**Success Criteria:**
- Drop MD file in folder → appears on Webflow within 2 minutes
- Metadata is accurate (title, summary, tags)
- Downloads work (full, summary, ZIP)

---

### Phase 2: Polish & Images (Week 3)
**Goal:** Professional presentation with auto-generated thumbnails

**Deliverables:**
- ✅ fal.ai integration
- ✅ Thumbnail generation for all modules
- ✅ Embeddings generation (stored, not used yet)
- ✅ Improved Webflow module page design
- ✅ Copy-to-clipboard functionality

**Success Criteria:**
- All modules have unique, professional thumbnails
- Module pages are polished and production-ready
- Embeddings stored in Supabase for future search

---

### Phase 3: Production Deploy (Week 4)
**Goal:** Live, stable, hosted on Railway

**Deliverables:**
- ✅ Railway deployment
- ✅ Environment variables configured
- ✅ GitHub CI/CD for auto-deploy
- ✅ Domain setup (if applicable)
- ✅ Publish initial 20 modules

**Success Criteria:**
- System runs reliably without manual intervention
- Keith can add new modules by uploading to folder
- Site is publicly accessible and performant

---

## 7. Future State (Post-MVP)

### PDF & Link Injection
**Goal:** Expand beyond markdown to include research papers, e-books

**Workflow:**
1. Upload PDF or provide URL
2. Mastra extracts text content
3. Generates markdown conversion
4. Follows standard ingestion pipeline
5. Includes source attribution

**Use Cases:**
- Research papers → curated summaries
- E-books → key insights + references
- Blog posts → archived snapshots

---

### Chat-Based Search
**Goal:** Semantic search interface on Webflow site

**Implementation:**
- Embed chatbot widget on site
- Query uses embeddings for semantic search
- Returns relevant modules + snippets
- Powered by OpenAI or similar

**User Experience:**
- "Find modules about debugging UX issues"
- Returns: UX Debugger Skill, related modules
- Can ask follow-up questions

---

### MCP Server / Tool Call Integration
**Goal:** Make CurrentPrompt accessible to agents (Claude, etc.)

**MCP Server Capabilities:**
- **List modules:** Get all available modules
- **Search:** Find modules by keyword/semantic query
- **Retrieve content:** Load full markdown as context
- **Get metadata:** Access summaries, tags, categories

**Use Case:**
- Claude agent can load "UX Debugger Skill" as system context
- Agents query CurrentPrompt for relevant knowledge
- Automated workflows pull from module library

---

## 8. Technical Decisions & Rationale

### Why Webflow?
- **Visual CMS:** Easy to design module pages without code
- **Fast iteration:** Keith can adjust layouts quickly
- **SEO-friendly:** Built-in optimization
- **No hosting complexity:** Fully managed

### Why Mastra?
- **Agent-based cleaning:** Intelligent content processing
- **Extensible:** Can add more complex workflows later
- **Keith's preference:** Familiar tool, good for prototyping

### Why Supabase?
- **All-in-one:** Database + storage + auth (if needed)
- **PostgreSQL:** Powerful search, embeddings support
- **Developer-friendly:** Great API, easy to work with

### Why Railway?
- **Simple deployment:** Git push → live
- **Affordable:** Good for small-scale projects
- **Scalable:** Can grow with usage

### Why fal.ai?
- **Fast image generation:** Optimized for speed
- **Good quality:** Professional-looking outputs
- **Simple API:** Easy integration

---

## 9. Success Criteria (MVP Complete)

### Phase 1 Complete When:
- ✅ Drop MD file in folder → live on Webflow (automated)
- ✅ Module has accurate metadata (title, summary, tags, category)
- ✅ Downloads work (full MD, summary MD, ZIP)
- ✅ 3-5 test modules successfully published

### Phase 2 Complete When:
- ✅ All modules have auto-generated thumbnails
- ✅ Webflow pages are polished and professional
- ✅ Copy-to-clipboard works
- ✅ Embeddings stored for future search

### Phase 3 Complete When:
- ✅ Backend deployed to Railway
- ✅ 20+ modules live on production site
- ✅ System runs reliably without manual intervention
- ✅ Keith can publish new modules in <5 minutes

---

## 10. Out of Scope (For Now)

- User accounts / authentication
- Community submissions (Keith-only curation)
- Comments / feedback system
- Analytics dashboard
- Mobile app
- Multi-language support
- Versioning UI (auto-versioning only)
- Advanced search filters (basic search only in MVP)

---

## 11. Open Questions

1. **Mastra Workflow:** Should cleaning be synchronous or async (queue-based)?
2. **Image Style:** What visual style for thumbnails? (Keith to provide examples)
3. **Category Taxonomy:** Predefined categories or dynamic?
4. **ZIP Contents:** What goes in the ZIP bundle beyond MD files?
5. **Webflow Limits:** How many CMS items on current plan? (Need to verify)

---

## 12. Next Steps

### Immediate (This Week)
1. **Review & approve PRD** – Keith confirms vision and scope
2. **Set up Webflow site** – Create collections, design module page
3. **Configure Railway** – Set up project, environment variables
4. **Build folder watcher** – Simple script to monitor uploads
5. **Test Mastra workflow** – Validate cleaning logic with sample MD

### Short Term (Next 2 Weeks)
1. **Build Phase 1** – End-to-end pipeline
2. **Add fal.ai integration** – Thumbnail generation
3. **Deploy to Railway** – Get it live
4. **Publish initial modules** – Keith's first 20

### Long Term (Month 2+)
1. **Add PDF/link injection** – Expand content types
2. **Build chat search** – Semantic discovery
3. **Create MCP server** – Agent integration
4. **Scale to 50+ modules** – Grow the library

---

## 13. Design Reference

*(User mentioned "attached design for reference" - to be added when provided)*

**Module Card (Feed View):**
- Thumbnail image (auto-generated)
- Title
- Category badge
- Summary (truncated)
- "View Details" CTA

**Module Page (CMS Detail View):**
- Hero: Title + thumbnail
- Summary section
- Metadata: Category, tags, owner, dates
- Downloads: Buttons for full MD, summary MD, ZIP
- Copy button: Copy markdown to clipboard
- Changelog: Version history
- Footer: Source attribution (if applicable)

---

## Appendix: Sample Module Structure

### Example: "UX Debugger Skill (v.2)"

**Metadata:**
```json
{
  "title": "UX Debugger Skill (v.2)",
  "slug": "ux-debugger-skill",
  "category": "Claude Skills",
  "tags": ["UX", "debugging", "Claude", "web development"],
  "summary": "A comprehensive Claude skill for identifying and resolving UX issues in web applications.",
  "meta_description": "Learn how to use the UX Debugger skill to analyze user interfaces, identify pain points, and suggest improvements.",
  "owner": "Keith Armstrong",
  "version": 2,
  "changelog": "v2: Added mobile-specific debugging patterns and improved error message analysis.",
  "created_at": "2025-11-01",
  "updated_at": "2025-11-10"
}
```

**Files:**
- `full.md` – Complete skill documentation (5-10 pages)
- `summary.md` – Quick reference (1-2 pages)
- `bundle.zip` – Contains full.md, summary.md, examples/
- `thumbnail.png` – Auto-generated image

**Webflow Display:**
- Feed card shows thumbnail + title + summary
- Click → full module page
- Download buttons for all formats
- Copy button for markdown code
- Changelog accordion for version history

---

**Ready for implementation!** 🚀
