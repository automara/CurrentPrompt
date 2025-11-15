# Documentation

Complete guides for CurrentPrompt setup, testing, and integration.

## Quick Links

### 📋 Setup & Configuration
- **[WEBFLOW_SETUP.md](./WEBFLOW_SETUP.md)** - How to create and configure your Webflow site with CMS
- **[MCP_GUIDE.md](./MCP_GUIDE.md)** - Model Context Protocol (MCP) endpoints for agent integration

### 🧪 Testing
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing workflow from CSV to Webflow to API

### 📚 Reference
- **[../PROJECT.md](../PROJECT.md)** - Project overview, architecture, and phases
- **[../PRD.md](../PRD.md)** - Detailed product requirements and specifications
- **[../README.md](../README.md)** - Quick project overview

---

## Getting Started

### New to CurrentPrompt?
1. Start with **PROJECT.md** to understand the vision
2. Read **WEBFLOW_SETUP.md** to set up your site
3. Follow **TESTING_GUIDE.md** to test the integration

### Want to Use MCP?
1. Read **MCP_GUIDE.md** for endpoint documentation
2. Try the example curl commands
3. Integrate with Claude or your agent

### Troubleshooting?
- See **TESTING_GUIDE.md** troubleshooting section
- Check API logs: `npm start`
- Verify Webflow credentials in `.env`

---

## Architecture

```
Supabase (Source of Truth)
    ↓
Express API (CRUD + Search)
    ↓
┌─────────────┬─────────────┐
│   Webflow   │     MCP     │
│   (Website) │   (Agents)  │
└─────────────┴─────────────┘
```

### Data Flow

**Create Module:**
1. POST /api/modules → Create in Supabase
2. POST /api/webflow/sync → Mirror to Webflow CMS

**Search Module:**
1. GET /api/modules/search → Full-text search in Supabase
2. GET /api/mcp/search → Same search for agents

**Load Module Content:**
1. GET /api/mcp/modules/:slug/content → Fetch from Supabase Storage
2. Agent uses content as context

---

## Available Endpoints

### Module Management
```
GET    /api/modules                    # List all published
POST   /api/modules                    # Create module
GET    /api/modules/:slug              # Get by slug
PUT    /api/modules/:id                # Update
DELETE /api/modules/:id                # Delete
GET    /api/modules/search?q=query     # Full-text search
GET    /api/modules/category/:cat      # Filter by category
GET    /api/modules/tag/:tag           # Filter by tag
```

### Webflow Sync
```
POST   /api/webflow/sync/:moduleId     # Sync single module
POST   /api/webflow/sync-all           # Sync all modules
DELETE /api/webflow/delete/:slug       # Remove from Webflow
```

### MCP (Agent Integration)
```
GET    /api/mcp/modules                # List for agents
GET    /api/mcp/modules/:slug          # Get module
GET    /api/mcp/modules/:slug/content  # Get markdown content
GET    /api/mcp/search?q=query         # Search
GET    /api/mcp/categories             # List categories
GET    /api/mcp/tags                   # List tags
GET    /api/mcp/stats                  # Statistics
```

---

## Project Phases

- ✅ **Phase 1: Foundation** - Supabase + API
- ✅ **Phase 2: Presentation** - Webflow integration
- 🔄 **Phase 3: Ingestion** - File uploads + Mastra workflow (In Progress)
- ⏳ **Phase 4: Search** - Semantic search (Future)
- ⏳ **Phase 5: MCP** - Full agent integration (Future)

---

## Common Tasks

### Import sample data to Webflow
→ See **TESTING_GUIDE.md** (Phase 1)

### Set up Webflow site
→ See **WEBFLOW_SETUP.md** (Step 1-6)

### Test API endpoints
→ See **TESTING_GUIDE.md** (Phase 3)

### Use with Claude
→ See **MCP_GUIDE.md**

### Deploy to production
→ See **PROJECT.md** (Deployment section - coming soon)

---

**Need help?** Check the troubleshooting section in TESTING_GUIDE.md or review the relevant setup guide.
