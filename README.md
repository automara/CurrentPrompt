# CurrentPrompt

A curated library of structured markdown knowledge modules, accessible via web API, Webflow CMS, and MCP for LLM agents.

## 🚀 Quick Start

### Read First
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - What's built, what's next
- **[docs/README.md](./docs/README.md)** - Documentation index
- **[PROJECT.md](./PROJECT.md)** - Full architecture and vision

### Get the Server Running
```bash
npm install
npm run build
npm start
```

The API runs on `http://localhost:3000`

### Next: Set Up Webflow
Follow [docs/WEBFLOW_SETUP.md](./docs/WEBFLOW_SETUP.md) to configure your Webflow site.

## What is CurrentPrompt?

CurrentPrompt is Keith's personal knowledge base of structured markdown modules. Each module includes:
- Categorized content with tags and versioning
- Full-text searchable metadata
- Downloadable formats (full markdown, summary, ZIP)
- Integration with Supabase (data), Webflow (website), and MCP (agents)

## 📊 Current Status

✅ **Phases 1 & 2 Complete**
- Express API with 12+ endpoints
- Supabase database fully configured
- Webflow CMS sync service ready
- MCP server for agent integration
- Sample data and documentation

🔄 **Phase 3 In Progress**
- File upload endpoint (coming next)
- Mastra ingestion workflow (coming next)
- Auto-sync on create/update (coming next)

## 📚 Documentation

| Topic | Link |
|-------|------|
| Project Overview | [PROJECT.md](./PROJECT.md) |
| Product Requirements | [PRD.md](./PRD.md) |
| Current Status | [CURRENT_STATUS.md](./CURRENT_STATUS.md) |
| Setup Guides | [docs/](./docs/) |
| Webflow Configuration | [docs/WEBFLOW_SETUP.md](./docs/WEBFLOW_SETUP.md) |
| Testing Workflow | [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) |
| MCP Integration | [docs/MCP_GUIDE.md](./docs/MCP_GUIDE.md) |
| Sample Data | [data/](./data/) |

## 🔗 Key Endpoints

### Module Management
```
GET    /api/modules              # List all published modules
POST   /api/modules              # Create new module
GET    /api/modules/:slug        # Get specific module
PUT    /api/modules/:id          # Update module
DELETE /api/modules/:id          # Delete module
GET    /api/modules/search       # Full-text search
```

### Webflow Sync
```
POST   /api/webflow/sync/:id     # Sync module to Webflow
POST   /api/webflow/sync-all     # Sync all modules
DELETE /api/webflow/delete/:slug # Remove from Webflow
```

### MCP (Agents)
```
GET    /api/mcp/modules          # List for agents
GET    /api/mcp/search           # Agent search
GET    /api/mcp/modules/:slug/content  # Get markdown
GET    /api/mcp/categories       # List categories
GET    /api/mcp/stats            # Statistics
```

## 🛠️ Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-backed)
- **CMS:** Webflow
- **Search:** PostgreSQL tsvector (full-text) + pgvector (semantic, future)
- **Agents:** MCP protocol for Claude & other LLMs

## 📖 How to Use

### For Website Builders
1. Set up Webflow site (see docs/WEBFLOW_SETUP.md)
2. Import sample CSV data
3. Test sync with API

### For Developers
1. Clone repo and run `npm install`
2. Configure Supabase credentials in `.env`
3. Run `npm start` to begin API development
4. See docs/TESTING_GUIDE.md for complete workflow

### For Agents/LLMs
1. Use MCP endpoints at /api/mcp/
2. Query modules via search or category/tag
3. Load content for context
4. See docs/MCP_GUIDE.md for examples

## ✅ What's Ready

- [x] Supabase database schema
- [x] Express API (12+ endpoints)
- [x] Webflow CMS sync service
- [x] Full-text search
- [x] MCP server for agents
- [x] Sample CSV data
- [x] Comprehensive documentation
- [ ] File upload endpoint (Phase 3)
- [ ] Mastra ingestion workflow (Phase 3)
- [ ] Semantic search (Phase 4)

## 🤝 Contributing

This is Keith's personal project. See [PROJECT.md](./PROJECT.md) for architecture decisions and contact info.

## 📝 License

MIT

---

**Questions?** See [docs/README.md](./docs/README.md) for help finding the right guide.
