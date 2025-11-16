# Test Guide - End-to-End Markdown Processing

This guide shows you how to test the complete markdown processing pipeline.

## Quick Start - Run Local Test (No Setup Required)

The fastest way to see the system in action:

```bash
npx tsx test-mock-local.ts
```

This will:
- ✅ Analyze the mock markdown file
- ✅ Simulate all 8 AI agents
- ✅ Generate quality scores and metadata
- ✅ Show expected storage paths
- ✅ Display complete processing results

**No server, no credentials, no external services required!**

## Test Files Overview

### 1. `test-mock.md` (6.1 KB)
Mock markdown content about "Building Scalable Microservices with Docker and Kubernetes"
- 790 words
- 29 headings
- 3 code blocks
- Technical guide with best practices

### 2. `test-mock-local.ts` (14 KB)
**Standalone local test** - Simulates the complete pipeline
- Analyzes markdown structure
- Simulates all 8 AI agents
- Generates quality scores
- No external dependencies

### 3. `test-e2e.ts` (6.8 KB)
**Full API integration test** - Tests against running server
- Requires server to be running
- Requires .env configuration
- Submits via HTTP API
- Verifies database results

### 4. `E2E-TEST-RESULTS.md` (8.3 KB)
**Complete test documentation** with results and analysis

## Running Different Types of Tests

### Local Simulation (Recommended for Quick Testing)

```bash
# Run the local mock test
npx tsx test-mock-local.ts
```

**Output includes:**
- Module analysis (word count, headings, structure)
- All 8 agent simulation results
- Quality score (95/100)
- SEO metadata
- Category classification (DevOps)
- Storage URLs
- Processing summary

### Full End-to-End (Requires Setup)

**Prerequisites:**
1. Configure `.env` file with credentials
2. Start the development server

```bash
# 1. Create .env from example
cp .env.example .env
# Then edit .env with your actual credentials

# 2. Start server (in one terminal)
npm run dev

# 3. Run E2E test (in another terminal)
npx tsx test-e2e.ts
```

This will test:
- Server health
- Agent availability
- API submission
- Database storage
- Supabase file uploads
- Webflow sync (optional)

### Run Existing Integration Tests

```bash
# Run the full test suite
npm run test:integration

# Run security tests
npm run test:security

# Run error handling tests
npm run test:errors
```

## What Gets Tested

### ✅ Content Analysis
- Title extraction from H1
- Slug generation
- Word/character counting
- Code block detection
- Heading structure analysis

### ✅ AI Agent Processing (8 Agents)

**Phase 1 - Parallel:**
1. Summary Agent → 3 summary lengths
2. SEO Agent → Meta tags, keywords
3. Category Agent → Content classification
4. Tag Agent → Relevant tags

**Phase 2 - Parallel:**
5. Schema Agent → JSON-LD markup
6. Image Prompt Agent → AI image prompts
7. Embeddings Agent → Vector embeddings

**Phase 3 - Validation:**
8. Validator Agent → Quality scoring

### ✅ Quality Assessment
- Content structure validation
- Quality scoring (0-100)
- Issue detection
- Recommendation generation

### ✅ Storage & Distribution
- File path generation
- Version control (v1, v2, etc.)
- Public URL creation
- CDN-ready structure

## Expected Results

When you run `test-mock-local.ts`, you should see:

```
✅ LOCAL MOCK TEST COMPLETED SUCCESSFULLY

Summary of Processing:
  • Analyzed 790 words across 29 sections
  • Generated 8 agent outputs
  • Quality Score: 95/100
  • Category: DevOps
  • Tags: Kubernetes, Docker, Step, Management, Challenge
```

## Understanding the Output

### Quality Score Breakdown
- **95/100** = Excellent quality
- **60-79** = Good quality
- **< 60** = Needs improvement

Factors affecting score:
- Has introduction (+5)
- Has conclusion (+5)
- Has 5+ headings (+10)
- Has 500+ words (+5)
- Has 1000+ words (+5)
- Has code examples (+10)

### Category Confidence
- **> 90%** = High confidence
- **70-89%** = Medium confidence
- **< 70%** = Low confidence (may need manual review)

### Processing Time (Real API)
- **Actual processing**: 10-40 seconds
- **API response**: Immediate (returns module ID)
- **Background processing**: Async via agents

## Troubleshooting

### Local Test Fails

```bash
# Make sure tsx is available
npm install -g tsx

# Or use npx
npx tsx test-mock-local.ts
```

### E2E Test Fails - Server Not Running

```bash
# Check if server is running
curl http://localhost:3000/health

# Start server if needed
npm run dev
```

### E2E Test Fails - Missing Credentials

```bash
# Create .env file
cp .env.example .env

# Edit with your credentials:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENROUTER_API_KEY
# - OPENAI_API_KEY
```

### TypeScript Errors

```bash
# Install dependencies
npm install

# Check TypeScript version
npx tsc --version
```

## Creating Your Own Test

To test with your own markdown file:

```bash
# 1. Create your markdown file
echo "# My Test Document" > my-test.md

# 2. Update test-mock-local.ts to point to your file
# Change: 'test-mock.md' → 'my-test.md'

# 3. Run the test
npx tsx test-mock-local.ts
```

Or submit directly via API:

```bash
curl -X POST http://localhost:3000/api/modules/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Test",
    "content": "# My Test\n\nContent here",
    "autoSync": false
  }'
```

## Next Steps

After running the tests:

1. **Review Results** - Check `E2E-TEST-RESULTS.md` for detailed analysis
2. **Modify Content** - Edit `test-mock.md` to test different content types
3. **Test Real API** - Run `test-e2e.ts` against running server
4. **Check Database** - Query PostgreSQL for stored modules
5. **Verify Storage** - Check Supabase Storage for uploaded files

## Support

For issues or questions:
- Check existing tests in `tests/` directory
- Review API documentation at `http://localhost:3000/`
- See integration tests for more examples

---

**Quick Command Reference:**

```bash
# Local simulation test (fastest)
npx tsx test-mock-local.ts

# Start server
npm run dev

# API integration test
npx tsx test-e2e.ts

# Full test suite
npm run test:integration
```
