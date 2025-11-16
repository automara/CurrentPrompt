# CurrentPrompt v3.0 - Fresh Start PRD

**Document Purpose:** Complete product requirements for restarting CurrentPrompt in a new repository with a fresh Claude Code instance, incorporating all learnings from the v2.0 implementation.

**Last Updated:** 2025-11-16
**Version:** 3.0 (Fresh Start Edition)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project History & Learnings](#2-project-history--learnings)
3. [Architecture & Technical Stack](#3-architecture--technical-stack)
4. [Core Features & Implementation](#4-core-features--implementation)
5. [Critical Success Factors](#5-critical-success-factors)
6. [Implementation Strategy](#6-implementation-strategy)
7. [Known Pitfalls & Solutions](#7-known-pitfalls--solutions)
8. [Testing & Validation](#8-testing--validation)
9. [Deployment Checklist](#9-deployment-checklist)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### What is CurrentPrompt?

CurrentPrompt is Keith Armstrong's personal knowledge module platform—an automated markdown publishing system that transforms local markdown files into a professionally curated, Webflow-hosted library with AI-generated metadata, summaries, and semantic search capabilities.

### Core Value Proposition

**For Keith:** Drop a markdown file in a folder → live on Webflow in 2 minutes with professional thumbnails, SEO metadata, summaries, and structured data—all automated.

**Key Differentiators:**
- **Automation-first:** Zero manual metadata entry
- **AI-powered:** 7 specialized agents generate high-quality content
- **Quality-gated:** 100-point validation system ensures excellence
- **Multi-format:** Full markdown, summaries, ZIP bundles
- **Future-ready:** Embeddings for semantic search, MCP for agent access

### Success Metrics (v2.0 Achieved)

✅ **14 Pull Requests** merged successfully
✅ **Railway Deployment** production-ready and stable
✅ **7 AI Agents** generating metadata in 10-20 seconds
✅ **Quality Scores** 95-100/100 on test content
✅ **Security Hardening** 18 vulnerabilities fixed
✅ **Admin Portal** React-based testing interface
✅ **Cost Optimization** ~$0.05 per module (90% reduction)

---

## 2. Project History & Learnings

### 2.1 Implementation Timeline (v2.0)

**Phase 1: Foundation (PR #1-2)** - Nov 15, 2025
- Webflow-first architecture refactor
- Basic ingestion pipeline
- File upload endpoints
- Initial Supabase integration
- **Key Learning:** Started with Webflow v1 API (deprecated), had to migrate to v2 Data API mid-stream

**Phase 2: AI Agents (PR #4-5)** - Nov 16, 2025
- 7 specialized agents using OpenRouter + Mastra
- Multi-phase workflow (parallel + sequential)
- Quality validation system
- Embeddings generation (3072 dimensions)
- **Key Learning:** Model selection matters—used mix of Gemini Flash, GPT-4o-mini, Claude Haiku for cost optimization

**Phase 3: Railway Deployment (PR #6, #12-14)** - Nov 16, 2025
- JSON API endpoint (Railway-compatible)
- Folder watcher for local development
- Production deployment fixes
- Node.js version compatibility (20.19+)
- Tailwind CSS v4 PostCSS configuration
- Package.json/lock file synchronization
- **Key Learning:** Railway deployment had 3 critical blockers that required sequential fixes

**Phase 4: Security & Testing (PR #7)** - Nov 16, 2025
- 42-test suite with Jest
- Security audit identified 18 vulnerabilities
- Rate limiting, input validation, XSS protection
- API key authentication
- CORS whitelisting
- **Key Learning:** Security hardening should be built-in from day 1, not retrofitted

**Phase 5: Documentation & Production (PR #8-9)** - Nov 16, 2025
- End-to-end test suite
- Production deployment guides
- Comprehensive documentation
- **Key Learning:** Documentation is critical for context resets and fresh starts

**Phase 6: Admin Portal (PR #10-11)** - Nov 16, 2025
- React + TypeScript + Vite frontend
- ShadCN UI components
- Drag & drop upload
- Test vs. Save modes
- **Key Learning:** Visual testing interface dramatically speeds up development

### 2.2 Critical Issues Encountered & Solutions

#### Issue #1: Railway Deployment Failures (PRs #12, #13, #14)

**Problem:** Three sequential deployment blockers
1. Node.js 18 incompatible with Vite 7.2.2 (`crypto.hash is not a function`)
2. Tailwind CSS v4 PostCSS migration errors
3. package-lock.json out of sync with package.json

**Root Cause:**
- Railway Nixpacks defaulted to Node 18.20.5
- Frontend build dependencies not locked
- Vite upgrade broke PostCSS configuration

**Solution:**
- Added `.nvmrc` with Node 20.19.0
- Added `nixpacks.toml` to force Node 20
- Fixed Tailwind PostCSS config in `frontend/postcss.config.js`
- Ran `npm install` to sync lock file

**Prevention Strategy:**
- Start with Node 20+ from day 1
- Lock all dependency versions
- Test Railway deployment early
- Use `engines` field in package.json

#### Issue #2: TypeScript Compilation Errors (PR #11)

**Problem:** `testResults` possibly undefined in ResultsPanel.tsx

**Root Cause:** TypeScript's static analysis couldn't infer flow control

**Solution:** Added non-null assertions (`!`) where guaranteed safe

**Prevention Strategy:**
- Enable strict TypeScript from start
- Fix type errors immediately, don't accumulate
- Use proper type guards

#### Issue #3: Vector Dimension Mismatch

**Problem:** Database used 1536 dimensions, but text-embedding-3-large produces 3072

**Root Cause:** Initial migration used wrong dimension count

**Solution:** Migration 003 to update vector dimensions (destructive—deletes existing embeddings)

**Prevention Strategy:**
- Verify AI model specs before schema design
- Document breaking migrations clearly

#### Issue #4: Webflow API Versioning

**Problem:** Started with Webflow v1 API, which is deprecated

**Root Cause:** Outdated documentation reference

**Solution:** Migrated to Webflow v2 Data API in PR #2

**Prevention Strategy:**
- Check API version and deprecation status before implementation
- Use latest official docs

### 2.3 Successful Architectural Decisions

✅ **Webflow-First Architecture**
- Using Webflow as primary CMS (not building custom frontend) saved weeks
- Webflow handles hosting, SEO, design iteration
- Backend focuses on automation pipeline

✅ **JSON API Instead of File Upload**
- Railway doesn't support persistent filesystem
- JSON endpoint is simpler, faster, more flexible
- Folder watcher still available for local dev

✅ **Multi-Agent Workflow with Mastra**
- 7 specialized agents outperform single GPT-4 call
- Parallel execution speeds up processing (10-20s total)
- Cost optimization: $0.05/module vs. $0.50/module
- Quality validation catches errors before DB save

✅ **React Admin Portal for Testing**
- Visual interface dramatically speeds up iteration
- "Test Mode" allows experimentation without DB pollution
- Instant feedback on AI agent outputs

✅ **Security Middleware from Start (Post-Facto)**
- Rate limiting prevents cost explosions
- Input validation prevents injection attacks
- API key auth prevents abuse
- Should have been implemented earlier

✅ **Comprehensive Testing Suite**
- 42 tests cover integration, security, errors
- Environment validator catches config issues
- Automated testing builds confidence

---

## 3. Architecture & Technical Stack

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CURRENTPROMPT v3.0                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │  External    │
│   (React)    │◄───────►│  (Express)   │◄───────►│  Services    │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                ▼
                    ┌────────────────────┐
                    │  AI Agent Pipeline │
                    └────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  Phase 1  │   │  Phase 2  │   │  Phase 3  │
        │ (Parallel)│   │ (Parallel)│   │(Sequential)│
        └───────────┘   └───────────┘   └───────────┘
                │               │               │
                ▼               ▼               ▼
        ┌───────────────────────────────────────────┐
        │         Supabase (DB + Storage)           │
        └───────────────────────────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Webflow CMS  │
                        └───────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend/CMS** | Webflow | Latest | Public-facing module library |
| **Admin Portal** | React + TypeScript | 18+ | Testing interface |
| **UI Framework** | Vite + Tailwind v4 | Latest | Development environment |
| **UI Components** | ShadCN UI | Latest | Pre-built components |
| **Backend** | Node.js + Express | 20.19+ | API server |
| **Language** | TypeScript | 5.3+ | Type safety |
| **Database** | Supabase (PostgreSQL) | Latest | Module metadata |
| **Vector DB** | pgvector (3072 dims) | Latest | Embeddings |
| **Storage** | Supabase Storage | Latest | File hosting |
| **AI Orchestration** | Mastra | 0.24+ | Agent framework |
| **LLM Gateway** | OpenRouter | Latest | 200+ models |
| **Embeddings** | OpenAI text-embedding-3-large | Latest | Semantic search |
| **File Watching** | Chokidar | 3.5+ | Local folder monitoring |
| **Security** | Helmet + express-rate-limit | Latest | Hardening |
| **Validation** | Zod | 3.25+ | Input validation |
| **Sanitization** | DOMPurify | Latest | XSS prevention |
| **Testing** | Jest + ts-jest | 29+ | Test framework |
| **Deployment** | Railway | Latest | Hosting |
| **CI/CD** | GitHub Actions | Latest | Auto-deploy |

### 3.3 Data Flow

```
INPUT SOURCES:
  ├─ JSON API (POST /api/modules/create) [Production]
  ├─ File Upload (POST /api/modules/upload) [Deprecated]
  └─ Folder Watcher (Local Dev Only)
            ↓
     [Validation Middleware]
            ↓
     [Rate Limiting]
            ↓
     [Sanitization]
            ↓
═══════════════════════════════════════
  AI AGENT WORKFLOW (10-20 seconds)
═══════════════════════════════════════
            ↓
  PHASE 1 (Parallel - 5s)
    ├─ Summary Agent (Gemini Flash)
    ├─ SEO Agent (GPT-4o-mini)
    ├─ Category Agent (Claude Haiku)
    └─ Tags Agent (Claude Haiku)
            ↓
  PHASE 2 (Parallel - 8s)
    ├─ Schema.org Agent (GPT-4o) [uses summaries]
    ├─ Image Prompt Agent (Claude Sonnet) [uses category]
    └─ Embeddings Agent (OpenAI) [uses full content]
            ↓
  PHASE 3 (Sequential - 2s)
    └─ Validator Agent (GPT-4o)
            ↓
     [Quality Gate: 70+ score]
            ↓
═══════════════════════════════════════
  DATABASE & STORAGE
═══════════════════════════════════════
            ↓
  Supabase PostgreSQL
    ├─ modules table (metadata)
    ├─ module_versions table (history)
    └─ module_embeddings table (vectors)
            ↓
  Supabase Storage
    └─ /modules/{slug}/v{N}/
        ├─ full.md
        ├─ summary.md
        └─ bundle.zip
            ↓
═══════════════════════════════════════
  WEBFLOW SYNC (Draft Mode)
═══════════════════════════════════════
            ↓
  POST /api/modules/sync/:id
            ↓
  Webflow CMS Collection Item
    └─ Status: Draft (for review)
            ↓
OUTPUT:
  ├─ Module ID (UUID)
  ├─ Public URLs (Storage)
  ├─ Quality Score (0-100)
  └─ Processing Time (seconds)
```

### 3.4 Database Schema

```sql
-- Core modules table
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- AI-generated summaries
  summary_short TEXT,          -- 150-200 chars
  summary_medium TEXT,          -- ~300 chars
  summary_long TEXT,            -- ~500 chars

  -- SEO metadata
  meta_title TEXT,              -- 50-60 chars
  meta_description TEXT,        -- 150-160 chars
  seo_keywords TEXT[],          -- 5-10 keywords

  -- Advanced metadata
  schema_json JSONB,            -- Schema.org markup
  image_prompt TEXT,            -- AI image generation prompt
  quality_score INTEGER,        -- 0-100
  validation_report JSONB,      -- Validator feedback

  -- Ownership
  owner TEXT DEFAULT 'Keith Armstrong',
  source_url TEXT,
  source_label TEXT,

  -- Webflow
  webflow_id TEXT,
  latest_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Version history
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changelog TEXT,
  file_paths JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, version)
);

-- Vector embeddings (3072 dimensions)
CREATE TABLE module_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  embedding VECTOR(3072),      -- text-embedding-3-large
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_tags ON modules USING GIN(tags);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_schema_json ON modules USING GIN(schema_json);
CREATE INDEX idx_embeddings_vector ON module_embeddings
  USING ivfflat (embedding vector_cosine_ops);
```

---

## 4. Core Features & Implementation

### 4.1 AI Agent Specifications

#### Agent 1: Content Summary Agent
- **Model:** Google Gemini Flash 1.5
- **Cost:** $0.001 per module
- **Outputs:** 4 summary formats (short, medium, long, markdown)
- **Prompt Strategy:** Active voice, value-oriented, technical accuracy

#### Agent 2: SEO Metadata Agent
- **Model:** OpenAI GPT-4o-mini
- **Cost:** $0.002 per module
- **Outputs:** Meta title, description, keywords
- **Prompt Strategy:** Front-load value, natural language, search intent

#### Agent 3: Category Classification Agent
- **Model:** Anthropic Claude 3 Haiku
- **Cost:** $0.003 per module
- **Outputs:** Primary category, confidence score
- **Categories:** Claude Skills, PRDs, Research, Guides, Tools, General

#### Agent 4: Tag Extraction Agent
- **Model:** Anthropic Claude 3 Haiku
- **Cost:** $0.003 per module
- **Outputs:** 3-5 tags, related topics
- **Format:** lowercase-hyphenated (e.g., "machine-learning")

#### Agent 5: Schema.org Generator
- **Model:** OpenAI GPT-4o
- **Cost:** $0.020 per module
- **Outputs:** 4+ schema types (Article, HowTo, FAQPage, etc.)
- **Purpose:** Answer Engine Optimization (AEO)

#### Agent 6: Image Prompt Generator
- **Model:** Anthropic Claude Sonnet 3.5
- **Cost:** $0.010 per module
- **Outputs:** Detailed image generation prompt
- **Use Case:** fal.ai thumbnail generation (future)

#### Agent 7: Embeddings Generator
- **Model:** OpenAI text-embedding-3-large
- **Cost:** $0.013 per module
- **Dimensions:** 3072
- **Purpose:** Semantic search, similarity matching

#### Agent 8: Validator (Quality Gate)
- **Model:** OpenAI GPT-4o
- **Cost:** Included in workflow
- **Threshold:** 70/100 minimum
- **Outputs:** Score, detailed feedback, error list

**Total Cost:** ~$0.053 per module (90% reduction vs. GPT-4 for all tasks)

### 4.2 API Endpoints

```typescript
// Module Management
POST   /api/modules/create        // JSON API (recommended)
POST   /api/modules/upload        // File upload (deprecated)
GET    /api/modules               // List all modules
GET    /api/modules/:slug         // Get specific module
DELETE /api/modules/:id           // Delete module

// Webflow Sync
POST   /api/modules/sync/:id      // Sync single module
POST   /api/modules/sync-all      // Bulk sync

// AI Agent Testing
POST   /api/test-agents           // Test workflow without saving
GET    /api/test-agents/health    // Environment check

// System
GET    /health                    // Health check
GET    /                          // API info
```

### 4.3 Security Middleware Stack

```typescript
// Applied in order:
1. Helmet (security headers)
2. CORS (whitelist only)
3. express.json({ limit: '2mb' })
4. Rate limiting (tiered by endpoint)
5. API key authentication (optional)
6. Input validation (Zod schemas)
7. Sanitization (DOMPurify)
8. Route handlers
9. Error handling
```

**Rate Limits:**
- General API: 100 req/15min per IP
- Module creation: 10 req/hour (prevents cost explosion)
- File upload: 5 req/hour
- Webflow sync: 30 req/hour
- Authenticated users: 3x multiplier

### 4.4 Admin Testing Portal

**Features:**
- Password protection (client-side)
- Drag & drop markdown upload
- Direct paste support
- Toggle "Test Only" vs. "Save to DB"
- Real-time results display
- Quality score visualization
- Detailed agent output inspection

**Tech Stack:**
- React 18 + TypeScript
- Vite (dev server + build)
- Tailwind CSS v4
- ShadCN UI components
- Lucide icons

**Deployment:**
- Built into `frontend/dist/`
- Served by Express in production
- Static file serving at `/`

---

## 5. Critical Success Factors

### 5.1 Must-Have from Day 1

✅ **Node.js 20.19+**
- Required for Vite 7+
- Add `.nvmrc` and `nixpacks.toml` immediately
- Set `engines` in package.json

✅ **Locked Dependencies**
- Use exact versions in package.json
- Commit package-lock.json
- Run `npm ci` in production

✅ **Security Middleware**
- Install Helmet, rate-limit, Zod from start
- Don't retrofit security later
- Enable API key auth in production

✅ **TypeScript Strict Mode**
- Fix type errors immediately
- Don't accumulate technical debt
- Use proper type guards

✅ **Railway Deployment Testing**
- Deploy early (even if incomplete)
- Test build process before heavy development
- Verify environment variables

✅ **Comprehensive .gitignore**
```
node_modules/
dist/
.env
.env.local
frontend/dist/
frontend/node_modules/
*.log
.DS_Store
```

### 5.2 Development Workflow Best Practices

**Git Strategy:**
- Branch naming: `automara/{feature-name}`
- Commit format: `type(scope): description`
- Never commit to `main` directly
- Tag all PRs with `by-claude`

**Commit Frequency:**
- Commit after each logical unit
- Small, focused commits
- Easy to revert if needed

**Testing Strategy:**
- Write tests alongside features
- Run `npm run test:all` before PR
- Verify Railway deployment after merge

**Documentation:**
- Update README when behavior changes
- Document breaking changes prominently
- Keep migration guides up-to-date

---

## 6. Implementation Strategy

### 6.1 Recommended Order of Operations

**Week 1: Foundation**
1. ✅ Initialize repository
2. ✅ Set up TypeScript + Express
3. ✅ Configure Supabase (database + storage)
4. ✅ Run database migrations
5. ✅ Install security middleware
6. ✅ Create health check endpoint
7. ✅ Deploy to Railway (skeleton)
8. ✅ Verify deployment works

**Week 2: AI Agent Pipeline**
9. ✅ Set up Mastra framework
10. ✅ Implement 7 agents (one by one)
11. ✅ Build coordinator workflow
12. ✅ Add validator agent
13. ✅ Test with sample content
14. ✅ Optimize for cost/speed

**Week 3: API & Storage**
15. ✅ Build JSON API endpoint
16. ✅ Implement file upload (deprecated but functional)
17. ✅ Set up Supabase Storage
18. ✅ Create folder watcher (local dev)
19. ✅ Add Webflow sync endpoints
20. ✅ Test end-to-end flow

**Week 4: Frontend & Polish**
21. ✅ Build React admin portal
22. ✅ Add ShadCN UI components
23. ✅ Implement drag & drop
24. ✅ Create results visualization
25. ✅ Integrate with backend
26. ✅ Build for production

**Week 5: Testing & Security**
27. ✅ Write integration tests
28. ✅ Write security tests
29. ✅ Write error handling tests
30. ✅ Run security audit
31. ✅ Fix all vulnerabilities
32. ✅ Achieve 100% test coverage

**Week 6: Production Deploy**
33. ✅ Final Railway deployment
34. ✅ Configure environment variables
35. ✅ Set up CI/CD
36. ✅ Run smoke tests
37. ✅ Publish initial modules
38. ✅ Monitor logs for errors

### 6.2 Dependency Installation Order

```bash
# 1. Core dependencies
npm install express cors dotenv

# 2. TypeScript
npm install -D typescript @types/node @types/express @types/cors ts-node

# 3. Security
npm install helmet express-rate-limit zod isomorphic-dompurify

# 4. Supabase
npm install @supabase/supabase-js

# 5. AI frameworks
npm install @mastra/core @mastra/openai ai @ai-sdk/openai openai openrouter-sdk

# 6. File handling
npm install multer chokidar
npm install -D @types/multer @types/chokidar

# 7. Testing
npm install -D jest ts-jest @types/jest

# 8. Frontend (in frontend/ directory)
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-* lucide-react class-variance-authority clsx tailwind-merge
```

### 6.3 Environment Variables Checklist

```bash
# .env (do not commit!)

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...

# Webflow (optional)
WEBFLOW_API_TOKEN=...
WEBFLOW_SITE_ID=...
WEBFLOW_COLLECTION_ID=...

# Security
API_KEY=your_secret_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
NODE_ENV=production
PORT=3000

# Frontend (in frontend/.env)
VITE_ADMIN_PASSWORD=your_password
VITE_API_URL=http://localhost:3000
```

---

## 7. Known Pitfalls & Solutions

### 7.1 Railway Deployment Issues

**Pitfall:** Railway uses Nixpacks which defaults to old Node versions

**Solution:**
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs_20"]
```

```
# .nvmrc
20.19.0
```

```json
// package.json
"engines": {
  "node": ">=20.19.0"
}
```

---

**Pitfall:** Frontend build fails on Railway

**Solution:**
- Add `build:frontend` script to backend package.json
- Railway runs `npm run build` which builds both
- Frontend output goes to `frontend/dist/`
- Express serves it in production

---

**Pitfall:** Tailwind CSS v4 PostCSS errors

**Solution:**
```js
// frontend/postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

---

### 7.2 TypeScript Issues

**Pitfall:** `possibly undefined` errors on safe code

**Solution:** Use non-null assertions (`!`) where flow control guarantees safety

```typescript
// Before (TypeScript complains)
if (testResults && createResults) return createResults;
return testResults.summary; // Error: possibly undefined

// After (explicit assertion)
return testResults!.summary; // We know it exists
```

---

**Pitfall:** Module resolution errors

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

### 7.3 Supabase Issues

**Pitfall:** Vector dimension mismatch (1536 vs 3072)

**Solution:**
- Verify model specs first (text-embedding-3-large = 3072)
- Update schema before generating embeddings
- Migration will delete existing embeddings

---

**Pitfall:** Service role key bypasses RLS

**Solution:**
- Use service role for internal operations only
- Document security model clearly
- Consider anon key + RLS for public endpoints

---

### 7.4 AI Agent Issues

**Pitfall:** High costs from using GPT-4 for everything

**Solution:** Use model mix:
- Gemini Flash for summaries (cheap, fast)
- GPT-4o-mini for SEO (cheap, good)
- Claude Haiku for classification (very cheap)
- GPT-4o only for complex tasks (schema, validation)
- Result: 90% cost reduction

---

**Pitfall:** Sequential execution is slow (60+ seconds)

**Solution:**
- Phase 1: Parallel (Summary, SEO, Category, Tags)
- Phase 2: Parallel (Schema, Image, Embeddings)
- Phase 3: Sequential (Validator)
- Result: 10-20 seconds total

---

**Pitfall:** Validation catches real errors, blocks save

**Solution:**
- This is a feature, not a bug
- Set threshold to 70/100 (not 100)
- Review validation feedback
- Improve content quality

---

### 7.5 Security Issues

**Pitfall:** No rate limiting = cost explosion

**Example:** 1000 modules created by attacker = $53 in AI costs

**Solution:**
- Module creation: 10 req/hour
- Authenticated users get higher limits
- Monitor usage logs

---

**Pitfall:** XSS in markdown content

**Solution:**
- DOMPurify sanitization on all outputs
- Strip dangerous tags/attributes
- Validate URLs

---

**Pitfall:** No authentication = public write access

**Solution:**
- API key authentication (optional but recommended)
- Set `API_KEY` environment variable
- Use Bearer token in requests

---

## 8. Testing & Validation

### 8.1 Test Suite Structure

```
tests/
├── setup.ts                # Environment validator
├── integration.test.ts     # End-to-end workflow (7 tests)
├── security.test.ts        # Security hardening (20 tests)
└── errors.test.ts          # Error handling (15 tests)
```

**Total:** 42 tests covering all critical paths

### 8.2 Running Tests

```bash
# Validate environment
npm run test:env

# Run all tests
npm run test:all

# Individual test suites
npm run test:integration
npm run test:security
npm run test:errors

# Coverage report
npm run test:coverage
```

### 8.3 Manual Testing Checklist

**Before Each PR:**
- [ ] Health endpoint responds
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] Railway deployment succeeds
- [ ] Environment variables configured

**Before Production Deploy:**
- [ ] End-to-end workflow test
- [ ] Security audit passes
- [ ] Rate limiting works
- [ ] API key auth functional
- [ ] CORS whitelist correct
- [ ] Frontend builds successfully
- [ ] Sample module created
- [ ] Webflow sync works
- [ ] Quality scores 70+

---

## 9. Deployment Checklist

### 9.1 Pre-Deployment

**Repository Setup:**
- [ ] Create new GitHub repository
- [ ] Add `.gitignore` (node_modules, dist, .env)
- [ ] Initialize with README
- [ ] Set up branch protection on `main`

**Supabase Setup:**
- [ ] Create new project
- [ ] Run migration 001 (schema)
- [ ] Run migration 002 (agent fields)
- [ ] Run migration 003 (vector dimensions)
- [ ] Create storage bucket `modules`
- [ ] Set bucket to public
- [ ] Get API keys (anon + service role)

**API Keys Collection:**
- [ ] OpenRouter API key
- [ ] OpenAI API key
- [ ] Webflow API token (optional)
- [ ] Supabase keys
- [ ] Generate secure API_KEY for auth

**Railway Setup:**
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set up auto-deploy on push to `main`

### 9.2 Railway Environment Variables

```bash
# Required
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...
NODE_ENV=production

# Security (recommended)
API_KEY=your_secret_key
ALLOWED_ORIGINS=https://your-app.railway.app,https://yourdomain.com

# Optional
WEBFLOW_API_TOKEN=...
WEBFLOW_SITE_ID=...
WEBFLOW_COLLECTION_ID=...
```

### 9.3 Post-Deployment

**Smoke Tests:**
- [ ] `GET /health` returns 200
- [ ] `GET /api/test-agents/health` returns ready
- [ ] Create test module via API
- [ ] Verify module in Supabase
- [ ] Verify files in Storage
- [ ] Check quality score 70+
- [ ] Test frontend loads
- [ ] Test admin password protection

**Monitoring:**
- [ ] Set up log monitoring
- [ ] Track API usage
- [ ] Monitor AI costs
- [ ] Watch error rates

---

## 10. Appendices

### Appendix A: File Structure

```
currentprompt/
├── src/
│   ├── index.ts                    # Express server + frontend serving
│   ├── lib/
│   │   └── supabase.ts            # Supabase client
│   ├── middleware/
│   │   ├── auth.ts                # API key authentication
│   │   ├── rateLimit.ts           # Tiered rate limiting
│   │   └── validation.ts          # Zod schemas
│   ├── services/
│   │   ├── ingestionService.ts    # AI agent coordinator
│   │   ├── moduleService.ts       # CRUD operations
│   │   └── webflowV2Service.ts    # Webflow sync
│   ├── agents/
│   │   ├── summary.ts             # Gemini Flash
│   │   ├── seo.ts                 # GPT-4o-mini
│   │   ├── category.ts            # Claude Haiku
│   │   ├── tags.ts                # Claude Haiku
│   │   ├── schema.ts              # GPT-4o
│   │   ├── imagePrompt.ts         # Claude Sonnet
│   │   ├── embeddings.ts          # OpenAI
│   │   └── validator.ts           # GPT-4o
│   ├── routes/
│   │   ├── modules.ts             # Module endpoints
│   │   └── test-agents.ts         # Agent testing
│   ├── utils/
│   │   └── sanitize.ts            # DOMPurify wrapper
│   └── watcher.ts                 # Folder monitoring
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── UploadForm.tsx
│   │   │   ├── ResultsPanel.tsx
│   │   │   └── ui/               # ShadCN components
│   │   ├── lib/
│   │   │   ├── api.ts            # Backend API calls
│   │   │   └── utils.ts          # Helpers
│   │   └── App.tsx
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.ts
├── tests/
│   ├── setup.ts
│   ├── integration.test.ts
│   ├── security.test.ts
│   └── errors.test.ts
├── migrations/
│   ├── 001_create_schema.sql
│   ├── 002_add_agent_fields.sql
│   └── 003_fix_vector_dimensions.sql
├── docs/
│   ├── AGENTS_README.md
│   ├── TESTING_GUIDE.md
│   ├── SECURITY_REPORT.md
│   └── WEBFLOW_SETUP.md
├── .nvmrc
├── nixpacks.toml
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── .env.example
└── README.md
```

### Appendix B: Cost Analysis

**Per Module Processing:**
- Gemini Flash (summaries): $0.001
- GPT-4o-mini (SEO): $0.002
- Claude Haiku (classification): $0.003
- Claude Haiku (tags): $0.003
- GPT-4o (schema): $0.020
- Claude Sonnet (image): $0.010
- OpenAI embeddings: $0.013
- GPT-4o (validation): Included
- **Total: ~$0.053 per module**

**Monthly Estimates (100 modules):**
- AI costs: $5.30/month
- Supabase: Free tier (1GB storage, 500K rows)
- Railway: ~$5/month (Hobby plan)
- OpenRouter: Pay-per-use
- **Total: ~$10-15/month**

### Appendix C: Migration Scripts

**001_create_schema.sql** - Initial database structure
**002_add_agent_fields.sql** - AI-generated metadata fields
**003_fix_vector_dimensions.sql** - Update embeddings to 3072 dimensions (DESTRUCTIVE)

**Important:** Run migrations in order. Migration 003 will delete existing embeddings.

### Appendix D: Success Metrics (v2.0 Actual Results)

✅ **Deployment:** Railway production-ready
✅ **Quality Scores:** 95-100/100 on test content
✅ **Processing Time:** 10-20 seconds average
✅ **Cost per Module:** $0.053 (90% reduction)
✅ **Test Coverage:** 42 tests passing
✅ **Security Rating:** D → B+ (18 vulnerabilities fixed)
✅ **Pull Requests:** 14 merged successfully
✅ **Documentation:** 25+ markdown files

### Appendix E: Key Learnings for Fresh Start

1. **Start with security built-in, not retrofitted**
2. **Deploy to Railway early to catch environment issues**
3. **Use Node 20+ from day 1**
4. **Lock all dependencies immediately**
5. **Write tests alongside features**
6. **Document as you build, not after**
7. **Use model mix for cost optimization**
8. **Parallel execution dramatically speeds up workflows**
9. **Visual testing interface accelerates iteration**
10. **Quality validation catches real errors**

---

## Next Steps for Fresh Implementation

1. **Create new repository** with proper .gitignore
2. **Set up Supabase project** and run all migrations
3. **Collect all API keys** (OpenRouter, OpenAI, Webflow)
4. **Initialize Node 20+ project** with TypeScript
5. **Install security middleware first** (Helmet, rate-limit, Zod)
6. **Build skeleton API** with health check
7. **Deploy to Railway immediately** to verify build process
8. **Follow week-by-week implementation plan** from Section 6.1
9. **Test continuously** using test suite from Section 8
10. **Deploy incrementally** following checklist from Section 9

---

**Document Status:** Complete and ready for fresh implementation
**Estimated Timeline:** 6 weeks to production-ready
**Confidence Level:** High (based on successful v2.0 implementation)

**Questions?** Review the 25+ documentation files from v2.0 for detailed implementation guides.
