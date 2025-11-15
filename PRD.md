# CurrentPrompt – Product Requirements Document (PRD)

**Last Updated:** 2025-11-15
**Status:** Draft – Ready for review

---

## 1. Overview

**CurrentPrompt** is a curated library of structured markdown "knowledge modules" designed as a community-facing resource managed by Keith. It starts as a personal knowledge base and evolves into a shareable platform accessible via web, API, and MCP for LLM agents.

**Not a marketplace.** It's Keith's carefully curated system—quality over quantity.

---

## 2. Vision & Goals

### Primary Goals
1. **Create a durable knowledge engine** – Structured modules with versioning, attribution, and discoverability
2. **Build a community resource** – Community-facing but internally curated (Keith controls what goes in)
3. **Enable machine consumption** – Future MCP integration for AI agents to load modules as context
4. **Start simple, scale deliberately** – Manual processes now, automation later if needed

### Success Metrics
- [ ] 50+ modules live and discoverable
- [ ] Users can search and download modules
- [ ] API/MCP integration working for agent consumption
- [ ] Low friction for Keith to add/update modules

---

## 3. Target Users

### Primary User: Keith
- **Need:** Curate and manage his knowledge modules
- **Pain point:** Currently scattered across notes, prompts, documents
- **Goal:** Centralize, version, and share

### Secondary Users: Community (Eventually)
- **Need:** Discover, access, and use high-quality prompt/knowledge modules
- **Pain point:** No trusted, curated source for structured prompts
- **Goal:** Find, download, and integrate into their workflows

### Tertiary Users: LLM Agents
- **Need:** Access modules as structured context via MCP
- **Pain point:** Agents can't currently load Keith's curated knowledge
- **Goal:** Seamless integration with Claude, other LLMs

---

## 4. Scope & Phases

### Phase 1: Foundation (Current)
**Deliverables:**
- [ ] Supabase project + database schema
- [ ] Core tables: `modules`, `module_versions`, `module_embeddings`
- [ ] Supabase Storage bucket for files
- [ ] Basic CRUD API endpoints
- [ ] Simple Webflow catalog view + search
- [ ] Manual module ingestion workflow

**Timeline:** 2-3 weeks
**Success:** Keith can manually add a module, see it on Webflow, and download it

---

### Phase 2: Ingestion & Versioning
**Deliverables:**
- [ ] Hybrid ingestion workflow (manual + Mastra automation)
- [ ] Version management (auto-increment, changelogs)
- [ ] File transformations (full markdown, summary, ZIP)
- [ ] Metadata syncing to Webflow CMS

**Timeline:** 2-3 weeks
**Success:** Keith can add raw content; system generates versions automatically

---

### Phase 3: Search & Discovery
**Deliverables:**
- [ ] Full-text search (PostgreSQL tsvector)
- [ ] Semantic search (embeddings, vector search)
- [ ] Advanced filtering (category, tags, version)
- [ ] Improved Webflow UX

**Timeline:** 2-3 weeks
**Success:** Users find modules by keyword and semantic meaning

---

### Phase 4: API & MCP Integration
**Deliverables:**
- [ ] REST API for module retrieval
- [ ] MCP server for agent consumption
- [ ] Authentication (if needed for future)
- [ ] Rate limiting, caching

**Timeline:** 2-3 weeks
**Success:** Claude and other agents can load CurrentPrompt modules as context

---

## 5. Data Model

### Core Tables

#### `modules`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID, PK | |
| `title` | text | Module name |
| `slug` | text, unique | URL-friendly identifier |
| `category` | text | e.g., "prompting", "system-design", "research" |
| `tags` | text[] | For filtering & discovery |
| `summary` | text | One-line description |
| `source_url` | text, nullable | Attribution link |
| `source_label` | text, nullable | Attribution name |
| `latest_version` | int | Current version number |
| `status` | enum | draft, published, archived |
| `search_text` | tsvector | Full-text search index |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

#### `module_versions`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID, PK | |
| `module_id` | UUID, FK | Reference to module |
| `version` | int | Version number (1, 2, 3…) |
| `changelog` | text, nullable | What changed |
| `file_paths` | JSON | Object with paths to full.md, summary.md, bundle.zip |
| `created_at` | timestamp | |

#### `module_embeddings` (Future)
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID, PK | |
| `module_id` | UUID, FK | |
| `embedding` | vector(1536) | OpenAI embeddings or similar |
| `created_at` | timestamp | |

### Supabase Storage Structure
```
modules/{slug}/v{n}/full.md
modules/{slug}/v{n}/summary.md
modules/{slug}/v{n}/bundle.zip
```

---

## 6. Key Features

### 6.1 Module Discovery (Webflow)
- **Catalog View:** Browse all published modules
- **Search:** Full-text search by title, summary, content
- **Filtering:** By category, tags, date
- **Module Page:** Title, summary, version info, download buttons
- **Downloads:** Full markdown, summary markdown, ZIP bundle

### 6.2 Module Management (Internal)
- **Manual Upload:** Keith adds markdown files + metadata
- **Auto-versioning:** Each update creates new version in `module_versions`
- **Metadata:** Title, category, tags, summary, attribution
- **Status:** Draft, Published, Archived

### 6.3 Ingestion (Hybrid)
- **Manual:** Upload existing markdown + fill metadata
- **Automated (Mastra):** Raw content → formatted markdown + summary
- **Workflow:** Receive input → Generate versions → Upload to Storage → Update DB → Sync to Webflow

### 6.4 Search & Discovery
- **v1:** Full-text search (keywords, tags, filters)
- **v2+:** Semantic search (embeddings, vector similarity)

### 6.5 API (Phase 4)
- **Endpoints:**
  - `GET /modules` – List all modules
  - `GET /modules/{slug}` – Get module details + latest version
  - `GET /modules/{slug}/v{n}` – Get specific version
  - `GET /modules/{slug}/download` – Download files
  - `GET /search?q={query}` – Full-text search
  - `GET /search/semantic?q={query}` – Semantic search (v2+)

### 6.6 MCP Integration (Phase 4)
- **Server:** Expose CurrentPrompt as MCP resource
- **Capabilities:** List modules, search, retrieve content
- **Use case:** Agents load modules as system context automatically

---

## 7. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Data** | Supabase (PostgreSQL) | Managed database, built-in auth, storage |
| **API** | Node.js / Express or Supabase Edge Functions | Lightweight, simple to maintain |
| **Ingestion** | Mastra (optional) | Agent framework for automation |
| **Frontend** | Webflow CMS | No-code, easy to manage metadata |
| **Storage** | Supabase Storage | Files backed by S3 |
| **Search** | PostgreSQL tsvector + pgvector (future) | Built-in full-text + semantic |
| **Deployment** | Vercel / Railway (API) | Simple, scalable |

---

## 8. Ingestion Workflow (Hybrid Model)

### Manual Path
1. Keith uploads markdown file
2. Fills in metadata (title, category, tags, summary)
3. System creates module + v1 in database
4. Files uploaded to Storage
5. Metadata synced to Webflow
6. Module appears on website

### Automated Path (Mastra)
1. Keith provides raw content (URL, text, notes)
2. Mastra receives input
3. Generates full markdown
4. Generates summary markdown
5. Creates ZIP bundle
6. Calls API to create module + version
7. Syncs to Webflow automatically

---

## 9. Versioning Strategy

- **Immutable:** Old versions never overwritten
- **Auto-increment:** Each update = new folder (v1, v2, v3…)
- **Changelog:** Document what changed in each version
- **Webflow:** Always shows latest version, but archives old versions
- **Storage:** All versions retained for rollback/history

**Example:**
```
modules/system-prompts/v1/full.md
modules/system-prompts/v2/full.md (updated)
modules/system-prompts/v3/full.md (improved)
```

---

## 10. Attribution & Legal

**Safe Practice:**
- Do not upload third-party content directly
- Only publish summaries, transformations, or original work
- Always include source attribution if derived from external sources
- Fields: `source_url`, `source_label`

---

## 11. Success Criteria (MVP)

### v1 Complete When:
- ✅ Supabase setup with all tables
- ✅ Keith can manually add a module via simple form/upload
- ✅ Module appears on Webflow with metadata
- ✅ Users can search and download
- ✅ Version history works (can create v2 from v1)
- ✅ Basic API working for CRUD

### v1 Success Looks Like:
- 5-10 modules live on CurrentPrompt
- Search works smoothly
- Downloads work
- Keith can add a new module in < 5 minutes

---

## 12. Out of Scope (for now)

- User accounts / authentication
- Comments / community feedback
- Module ratings / reviews
- Community submissions (only Keith curates)
- Complex analytics
- Mobile app

---

## 13. Open Questions

1. **Mastra vs Custom:** Should we use Mastra framework or build custom ingestion?
2. **API Auth:** For phase 4, do we need authentication, or public read-only?
3. **Webflow Sync:** Real-time sync or batch updates?
4. **Cost:** Any concerns about Supabase costs at scale (500+ modules)?

---

## 14. Next Steps

1. **Review & Approve PRD** – Confirm goals and scope
2. **Set up Supabase** – Create project, database, tables
3. **Design API** – Define endpoints and request/response shapes
4. **Build Phase 1** – Manual ingestion, basic Webflow integration
5. **Test with real data** – Add 5-10 modules, validate workflow

---

**Ready for feedback!**
