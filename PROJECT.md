# CurrentPrompt – Project Documentation

## Goal

Build CurrentPrompt as Keith's curated library of structured markdown "knowledge modules."
These modules will be stored in Supabase, displayed on a Webflow site, and eventually accessible through an API or MCP for agents to load as context.

---

## Core Concept

CurrentPrompt is:
- A personal knowledge base
- Structured as markdown modules
- Each with categories, tags, summaries, versions, and download files
- Designed for both human browsing (Webflow) and machine consumption (API/MCP)

**It is not a marketplace.**
It's Keith's own curated system that grows into a durable knowledge engine.

---

## Architecture Overview

### 1. Supabase (Source of Truth)

**Tables:**

#### `modules`
- `id` (UUID, primary key)
- `title` (text)
- `slug` (text, unique)
- `category` (text)
- `tags` (text array or JSON)
- `summary` (text)
- `source_url` (text, nullable)
- `source_label` (text, nullable)
- `latest_version` (integer)
- `status` (enum: draft, published, archived)
- `search_text` (tsvector, for fast full-text search)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `module_versions`
- `id` (UUID, primary key)
- `module_id` (UUID, foreign key)
- `version` (integer)
- `changelog` (text, nullable)
- `file_paths` (JSON) - references to full.md, summary.md, bundle.zip
- `created_at` (timestamp)

#### `module_embeddings` (optional, future)
- `id` (UUID, primary key)
- `module_id` (UUID, foreign key)
- `embedding` (vector)
- `created_at` (timestamp)

**Supabase Storage File Structure:**
```
modules/{slug}/v{n}/full.md
modules/{slug}/v{n}/summary.md
modules/{slug}/v{n}/bundle.zip
```

### 2. Webflow (Presentation Layer)

Webflow CMS stores a mirror of module metadata:
- title
- slug
- category
- tags
- summary
- latest version
- download URLs (full md, summary md, ZIP)

**Purpose:** Used only for the website UI.
**Master Database:** Supabase remains the source of truth.

### 3. Gumloop (Ingestion & Automation Layer)

Gumloop powers the ingestion workflow:
1. Takes raw content, URL, or notes
2. Generates formatted full markdown
3. Generates a summarized markdown version
4. Creates ZIP bundle
5. Uploads files to Supabase Storage
6. Updates `modules` and `module_versions` via REST API
7. Syncs metadata to Webflow CMS if needed
8. Increments version numbers automatically

**Purpose:** Transformation + automation layer, not storage.

### 4. Search Layer

To support future API/MCP:
- **Full-text search** via `search_text` tsvector in modules table
- **Optional semantic search** via embeddings table
- **API returns** module metadata + file URLs
- **Agents** can load markdown directly from Supabase Storage

### 5. Versioning

- Each update creates a new version in `module_versions`
- Files are never overwritten
- Version = folder path (v1, v2, v3…)
- Supabase stores version numbers; Webflow displays latest only
- GitHub can optionally be used later as a private backup mirror

---

## Attribution

Safe practice:
- Do not upload third-party content directly
- Only publish summaries, transformations, or interpretations
- Store source attribution as `source_url` and `source_label`

---

## Features & CTAs

Each module page on Webflow includes:
- Download Full Markdown
- Download Summary Markdown
- Download ZIP bundle

All files are served from Supabase Storage.

---

## Setup Instructions

*(To be completed as we build out each component)*

### Prerequisites
- [ ] Supabase account and project created
- [ ] GitHub repo initialized and pushed
- [ ] Webflow site set up (optional for v1)
- [ ] Gumloop account created (optional for v1)

### Local Development
```bash
cd /Users/keitharmstrong/code/command-center/currentprompt
git clone https://github.com/automara/currentprompt.git
```

---

## Progress & Changelog

### Phase 1: Foundation ✅ COMPLETE
- [x] Create project directory
- [x] Initialize git repository
- [x] Create PROJECT.md documentation
- [x] Set up Supabase project and create database schema
- [x] Set up Supabase Storage bucket structure
- [x] Build API endpoints for module CRUD and search
- [x] Implement full-text search (tsvector)
- [x] Create sample module in database

**Status:** Foundation complete. API running and tested. Database schema fully functional.

### Phase 2: Presentation Layer (In Progress) ✅ COMPLETE
- [x] Design Webflow CMS integration
- [x] Build sync mechanism from Supabase to Webflow
- [x] Create Webflow setup guide
- [x] Implement webhook-ready sync endpoints

**Status:** Webflow integration built and ready. Requires Webflow site setup and credentials.

### Phase 3: Ingestion Pipeline
- [ ] Design Mastra/agent workflow
- [ ] Build file transformation logic (markdown generation)
- [ ] Implement version management via API
- [ ] Auto-sync to Webflow on create/update

### Phase 4: Search & Discovery (Future)
- [ ] Implement semantic search with embeddings
- [ ] Add advanced filtering and faceting
- [ ] Performance optimization for large datasets

### Phase 5: MCP & Agent Integration (Future)
- [ ] Build MCP server for Claude/agents
- [ ] Create agent capabilities for module loading
- [ ] Document agent integration patterns

---

## Notes

- Keep things simple and manual until they need to be automated
- Every decision is reversible; we can change architecture later
- Focus on getting v1 working before optimizing

---

**Last Updated:** 2025-11-15 (Phase 1 & 2 Complete)
