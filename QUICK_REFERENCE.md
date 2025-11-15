# CurrentPrompt - Quick Reference Card

**Print this or bookmark it!**

---

## 🚀 Getting Started (30 seconds)

```bash
cd /Users/keitharmstrong/code/command-center/currentprompt
npm install          # (first time only)
npm run build
npm start
```

API runs on: **http://localhost:3000**

---

## 📍 Current Status

- ✅ Supabase database configured
- ✅ Express API built (12+ endpoints)
- ✅ Webflow sync service ready
- ✅ MCP server ready
- ⏳ **NEXT:** Webflow CMS setup & testing

---

## 🔑 Critical URLs & Credentials

| What | Where |
|------|-------|
| Supabase | https://fhuocowvfrwjygxgzelw.supabase.co |
| Webflow Site | https://automara.webflow.io |
| Local API | http://localhost:3000 |
| GitHub Repo | https://github.com/automara/CurrentPrompt |
| .env file | /Users/keitharmstrong/code/command-center/currentprompt/.env |

**Credentials:** See `.env` file (already set up for Supabase)

---

## 📋 Essential Commands

```bash
# Start the API
npm start

# Build TypeScript
npm run build

# View health
curl http://localhost:3000/health

# List modules
curl http://localhost:3000/api/modules

# Sync to Webflow
curl -X POST http://localhost:3000/api/webflow/sync-all

# Search modules
curl "http://localhost:3000/api/modules/search?q=system"

# Test MCP
curl http://localhost:3000/api/mcp/stats
```

---

## 📂 Key Files (When You Need Them)

| Need | File | Time |
|------|------|------|
| Quick setup | `docs/WEBFLOW_QUICK_START.md` | 5 min |
| Detailed guide | `docs/WEBFLOW_CMS_SCHEMA.md` | 20 min |
| Testing | `docs/TESTING_GUIDE.md` | 30 min |
| Architecture | `PROJECT.md` | 10 min |
| Full context | `CONTEXT.md` | 15 min |
| Sample data | `data/webflow_*.csv` | import |

---

## 📊 What to Import to Webflow

### 1. Categories Collection
**File:** `data/webflow_categories.csv`
**Items:** 6 (Prompting, Research, Writing, Development, Productivity, Methodology)

### 2. Tags Collection
**File:** `data/webflow_tags.csv`
**Items:** 18 (Templates, System, Beginner, Advanced, Framework, Best Practices, Tools, Strategy, Troubleshooting, Case Study, API, Design, Architecture, Testing, Customer, Organization, Knowledge, Meetings)

### 3. Modules Collection
**File:** `data/webflow_modules_with_refs.csv`
**Items:** 10 sample modules
**Note:** Needs reference fields for Category (single) and Tags (multiple)

---

## 🔌 API Endpoints at a Glance

### Get Data
```
GET /api/modules                    # All published
GET /api/modules/:slug              # Specific module
GET /api/modules/search?q=...       # Search
GET /api/mcp/modules                # For agents
GET /api/mcp/search?q=...           # Agent search
```

### Sync & Manage
```
POST /api/webflow/sync-all          # Sync to Webflow
POST /api/webflow/sync/:id          # Sync one
DELETE /api/webflow/delete/:slug    # Remove from Webflow
```

### Create/Update
```
POST /api/modules                   # Create module
PUT /api/modules/:id                # Update
DELETE /api/modules/:id             # Delete
```

---

## 🧪 Testing Workflow

1. **API Running?**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Supabase Connected?**
   ```bash
   curl http://localhost:3000/api/modules
   ```

3. **Webflow Configured?**
   - Check `.env` has `WEBFLOW_API_TOKEN`, `WEBFLOW_SITE_ID`

4. **Sync Works?**
   ```bash
   curl -X POST http://localhost:3000/api/webflow/sync-all
   ```

5. **Webflow Updated?**
   - Check CMS manually for new modules

6. **MCP Working?**
   ```bash
   curl http://localhost:3000/api/mcp/stats
   ```

---

## 🎯 Phase 2.5 Checklist (This Week)

- [ ] Webflow collections created (3 total)
- [ ] CSV data imported (categories, tags, modules)
- [ ] Reference fields linked correctly
- [ ] Webflow API token obtained
- [ ] `.env` updated with credentials
- [ ] Sync endpoints tested
- [ ] Download links verified
- [ ] MCP endpoints responding
- [ ] Testing complete (see TESTING_GUIDE.md)

**Status:** Check CURRENT_STATUS.md for updates

---

## 🆘 Common Issues

| Problem | Fix |
|---------|-----|
| API won't start | `npm run build` first |
| Webflow sync fails | Check WEBFLOW_API_TOKEN in .env |
| Reference fields not linking | Slugs must match exactly |
| Download links broken | Files not uploaded to Supabase Storage |
| Can't find CONTEXT.md | It's in: `currentprompt/CONTEXT.md` |

---

## 📚 Documentation Hierarchy

1. **Start here:** `CONTEXT.md` (you are reading this guide)
2. **Quick setup:** `docs/WEBFLOW_QUICK_START.md` (5 min)
3. **Detailed:** `docs/WEBFLOW_CMS_SCHEMA.md` (full steps)
4. **Testing:** `docs/TESTING_GUIDE.md` (validation)
5. **Reference:** `docs/README.md` (everything)

---

## 🔗 GitHub Repository

```
https://github.com/automara/CurrentPrompt

Recent commits show:
- Webflow integration
- MCP server
- Sample CSVs
- Complete documentation
```

---

## 💬 Notes for Next Session

When you return after context clear:

1. ✅ Read **CONTEXT.md** (comprehensive)
2. ✅ Check **CURRENT_STATUS.md** (latest)
3. ✅ Review this **QUICK_REFERENCE.md** (15 seconds)
4. ✅ Follow **Immediate Next Steps** in CONTEXT.md
5. ✅ Use **Testing Checklist** to track progress

---

## 🚀 The Big Picture

```
You → Webflow (Design) ↔ Supabase (Database) → API → MCP → Claude
```

**Right now:** Building the ↔ bridge (Webflow ↔ Supabase)
**Next:** File uploads and automation (Phase 3)

---

**Everything is in place. You've got this! 🎯**
