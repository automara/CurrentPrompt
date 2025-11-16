# Testing the Content Generation Agents

## Quick Start

### 1. Set Environment Variables

Since you have the `OPENROUTER_API_KEY` in Railway, you'll need it locally for testing. Create a `.env` file:

```bash
# Copy from example
cp .env.example .env

# Edit .env and add your keys
nano .env  # or use your preferred editor
```

**Required variables for testing:**
```bash
OPENROUTER_API_KEY=your_openrouter_key_from_railway
OPENAI_API_KEY=your_openai_key_for_embeddings
```

**Optional (for full pipeline test):**
```bash
SUPABASE_URL=https://fhuocowvfrwjygxgzelw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WEBFLOW_API_TOKEN=your_webflow_token
WEBFLOW_COLLECTION_ID=your_collection_id
FAL_API_KEY=your_fal_api_key
```

### 2. Install Dependencies (if needed)

```bash
npm install
```

### 3. Run the Agent Test

```bash
npx ts-node --esm test-agents.ts
```

This will:
- ✅ Check environment variables
- 📄 Load `test-content.md`
- 🤖 Run all 7 agents in the workflow
- ✓ Validate results
- 📊 Display detailed output

**Expected output:**
```
🧪 Testing Agent Workflow

Environment Check:
  OPENROUTER_API_KEY: ✅ Set
  OPENAI_API_KEY: ✅ Set
  ...

🚀 Starting Agent Workflow...
📄 Processing: Building AI-Powered Content Pipelines with Claude
────────────────────────────────────────────────────────────────

📊 Phase 1: Running independent agents in parallel...
📝 Summary Agent: Generating summaries...
✅ Summary Agent: Summaries generated successfully
🔍 SEO Agent: Generating metadata...
✅ SEO Agent: Metadata generated successfully
...

📊 RESULTS SUMMARY
════════════════════════════════════════════════════════════════

✅ Summary Agent:
   Short: Creating automated content generation systems...
   ...

✓ Validator Agent:
   Valid: ✅ YES
   Quality Score: 87/100
   Issues: 0

⏱️  Total Processing Time: 12453ms
════════════════════════════════════════════════════════════════

✅ Test completed successfully!
```

### 4. Test Full Pipeline (with Supabase + Webflow)

Once the basic test works, run the full ingestion pipeline:

```bash
# Build the project
npm run build

# Start the server
npm run dev

# In another terminal, upload test content
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@test-content.md"
```

This will:
1. Run all 7 agents
2. Store in Supabase (draft status)
3. Generate embeddings
4. Upload files to Supabase Storage
5. Generate thumbnail (if FAL_API_KEY set)
6. Sync to Webflow (draft status)

## Troubleshooting

### "OPENROUTER_API_KEY not set"
- Make sure `.env` file exists in project root
- Check the key is copied correctly from Railway
- Restart the process after adding the key

### "OpenRouter API error"
- Check API key is valid
- Verify you have credits in OpenRouter account
- Check which model failed in console output

### "Embeddings Agent failed"
- Ensure `OPENAI_API_KEY` is set
- Verify OpenAI API key is valid and has credits
- Check content length < 32k characters

### Low Quality Scores
- Review the validation report in console output
- Check individual agent outputs
- Content might be too short or generic

### TypeScript Errors
```bash
# Rebuild
npm run build

# Check for errors
npx tsc --noEmit
```

## What to Review

When reviewing the test output, check:

1. **All agents complete successfully** - No errors in Phase 1, 2, or 3
2. **Quality score** - Should be 70+ for good content
3. **Summaries** - Are they accurate and engaging?
4. **SEO metadata** - Does it match the content?
5. **Category** - Is it correct? (Should be "Guides" for test-content.md)
6. **Tags** - Are they relevant? (Should include ai, claude, content-generation, etc.)
7. **Schema.org** - Are the types appropriate? (Should include Article, BreadcrumbList, etc.)
8. **Embeddings** - Should be 3072 dimensions for text-embedding-3-large
9. **Processing time** - Should be 10-20 seconds with parallel execution

## Cost Estimate

Each test run costs approximately **$0.05** (5 cents):
- Summary: $0.001
- SEO: $0.002
- Category: $0.001
- Tags: $0.001
- Schema: $0.015
- Image Prompt: $0.005
- Embeddings: $0.013
- Validator: $0.015

## Next Steps After Testing

1. ✅ **Review output quality** - Adjust prompts if needed
2. 🗄️ **Run database migration** - Apply `migrations/002_add_agent_fields.sql` to Supabase
3. 🚀 **Deploy to Railway** - Environment variables should already be set
4. 📊 **Monitor production** - Check Mastra dashboard for observability
5. 🎨 **Update Webflow schema** - Add new fields if needed (meta-title, summary-short, etc.)

## Fine-Tuning Prompts

If you want to adjust agent behavior:

1. **Edit prompts** in `/src/agents/[agent-name].ts`
2. Look for `const SYSTEM_PROMPT = ...`
3. Modify instructions
4. Run `npm run build`
5. Test again with `test-agents.ts`

Example agents to tune:
- **Summary** - Adjust tone, length, style
- **SEO** - Change keyword strategy
- **Category** - Adjust decision tree logic
- **Schema** - Add/remove schema types

## Prompt Engineering Tips

- Be specific about output format
- Include examples in prompts
- Set clear constraints (character limits, format)
- Use few-shot learning for better results
- Test with different content types
- Monitor quality scores over time

---

Happy testing! 🚀
