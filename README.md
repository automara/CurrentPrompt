# CurrentPrompt

**Version 2.0 - Webflow-First Architecture**

Automated markdown module publishing system with Webflow CMS integration. Drop a markdown file in a folder, and it automatically appears on your Webflow site with professional thumbnails, summaries, and SEO metadata.

## 🚀 Quick Start

### Read First
- **[PRD.md](./PRD.md)** - Product requirements (v2.0 Simplified)
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - What's built, what's next
- **[PROJECT.md](./PROJECT.md)** - Full architecture and vision

### Install & Run
```bash
npm install
npm run build

# Start API server
npm start

# OR start folder watcher (monitors uploads/ for new .md files)
npm run watch
```

The API runs on `http://localhost:3000`

## What is CurrentPrompt?

CurrentPrompt is Keith's personal knowledge base - an automated publishing system that transforms local markdown files into a polished, Webflow-hosted library.

### Core Features
- **Automated ingestion** - Drop MD file → live on Webflow in minutes
- **Professional presentation** - Auto-generated thumbnails (fal.ai)
- **AI-powered metadata** - 7 specialized agents generate summaries, SEO, tags, Schema.org, embeddings
- **Multi-agent workflow** - Parallel execution with quality validation (OpenRouter + Mastra)
- **Multiple formats** - Full MD, summary MD, ZIP downloads
- **Version history** - Track changes over time
- **Source attribution** - Proper credit for adapted content

## 📊 Current Status

✅ **v2.0 Complete + AI Agents Integrated**
- Webflow-first architecture implemented
- File upload endpoint with multer
- Folder watcher service (chokidar)
- 7 specialized AI agents (OpenRouter + Mastra)
- Quality validation workflow (100/100 score)
- fal.ai thumbnail generation service
- Updated database schema with agent fields
- Deployed to Railway (production-ready)

🔄 **Phase 1 In Progress**
- Test full upload workflow with real content
- Configure Webflow collections
- Publish first 20 modules

## 📚 Documentation

| Topic | Link |
|-------|------|
| Product Requirements | [PRD.md](./PRD.md) |
| Current Status | [CURRENT_STATUS.md](./CURRENT_STATUS.md) |
| Project Overview | [PROJECT.md](./PROJECT.md) |
| AI Agents Guide | [AGENTS_README.md](./AGENTS_README.md) |
| Agent Testing | [TESTING.md](./TESTING.md) |
| Railway Deployment | [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) |
| Webflow Configuration | [docs/WEBFLOW_SETUP.md](./docs/WEBFLOW_SETUP.md) |
| Sample Data | [data/](./data/) |

## 🔗 Key Endpoints

### Upload & Sync
```
POST   /api/modules/create        # Create module from JSON (recommended)
POST   /api/modules/upload        # Upload markdown file (deprecated)
POST   /api/modules/sync/:id      # Sync module to Webflow
POST   /api/modules/sync-all      # Sync all modules
```

### Module Access
```
GET    /api/modules               # List all published modules
GET    /api/modules/:slug         # Get specific module
```

### AI Agents
```
POST   /api/test-agents           # Test agent workflow with content
GET    /api/test-agents/health    # Check agent environment
```

### System
```
GET    /health                    # Health check
GET    /                          # API info
```

## 🛠️ Tech Stack

- **Frontend/CMS:** Webflow (primary interface)
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL with pgvector)
- **Storage:** Supabase Storage (S3-backed)
- **AI Orchestration:** Mastra (agent framework)
- **LLM Access:** OpenRouter (200+ models)
- **Embeddings:** OpenAI text-embedding-3-large
- **Images:** fal.ai (thumbnail generation)
- **File Watching:** chokidar
- **Deployment:** Railway

## 🔄 Data Flow

```
JSON API Request (markdown content)
    ↓
Ingestion Service (AI agent processing)
    ↓
7 AI Agents (OpenRouter + Mastra)
├── Phase 1 (Parallel): Summary, SEO, Category, Tags
├── Phase 2 (Parallel): Schema.org, ImagePrompt, Embeddings
└── Phase 3 (Sequential): Validator (quality gate)
    ↓
Supabase (database + storage + embeddings)
    ↓
fal.ai (thumbnail generation)
    ↓
REST API (sync)
    ↓
Webflow CMS (draft status for review)

Alternative (local dev):
Local Folder (~/uploads/*.md) → Folder Watcher → Same flow as above
```

## 📖 How to Use

### 1. Setup Environment

Create a `.env` file:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webflow (optional)
WEBFLOW_API_TOKEN=your_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=your_collection_id

# fal.ai (optional, for thumbnails)
FAL_API_KEY=your_fal_key

# AI Agents (REQUIRED for content generation)
OPENROUTER_API_KEY=your_openrouter_key  # For 7 AI agents
OPENAI_API_KEY=your_openai_key          # For embeddings only

# Folder watcher
WATCH_FOLDER=./uploads
```

### 2. Run Database Migrations

Run the SQL migrations in your Supabase project:
- `migrations/001_create_schema.sql`
- `migrations/002_add_agent_fields.sql` (adds AI-generated metadata fields)

### 3. Start the Services

**Option A: API Server** (manual uploads via HTTP)
```bash
npm start
```

**Option B: Folder Watcher** (auto-process new files)
```bash
npm run watch
```

### 4. Upload Modules

**Recommended: JSON API** (works on Railway)
```bash
curl -X POST http://localhost:3000/api/modules/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Module Title",
    "content": "# My Module\n\nMarkdown content here..."
  }'
```

**Optional: Via Folder Watcher** (local development only)
```bash
# Drop a markdown file in the uploads folder
cp my-module.md uploads/
# Watcher automatically processes it
```

**Deprecated: File Upload API**
```bash
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@my-module.md"
```

## ✅ What's Ready (v2.0)

- [x] Webflow-first architecture
- [x] File upload endpoint
- [x] Folder watcher service
- [x] 7 AI agents with validation (OpenRouter + Mastra)
- [x] Quality gate workflow (100/100 test score)
- [x] Embeddings for semantic search
- [x] Schema.org AEO optimization
- [x] fal.ai thumbnail service
- [x] Database schema with agent fields
- [x] Webflow sync endpoints (draft mode)
- [x] Production deployment (Railway)
- [ ] Initial 20 modules published

## 🗂️ Archived Features

The following features were moved to `archive/` for future implementation:

- **MCP server** - Agent integration (Phase 4+)
- **Advanced search endpoints** - Category/tag filtering
- **Manual CRUD endpoints** - Focus on automated ingestion

These may be re-introduced in future phases.

## 🤝 Contributing

This is Keith's personal project. For questions or issues, see the GitHub repository.

## 📝 License

MIT

---

**Questions?** See [PRD.md](./PRD.md) for detailed architecture and implementation plan.
