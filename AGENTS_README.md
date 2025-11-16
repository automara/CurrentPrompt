# Content Generation Agents

This document describes the AI-powered content generation system built with specialized agents using OpenRouter and OpenAI.

## Architecture Overview

The system uses **7 specialized agents** orchestrated in a multi-phase workflow to generate high-quality metadata, summaries, SEO content, and embeddings for markdown modules.

```
Upload .md → Coordinator Workflow → [7 Parallel/Sequential Agents] → Validator → Supabase → Webflow (draft)
```

## Agent Specifications

### 1. Content Summary Agent
**Model:** Google Gemini Flash 1.5
**Purpose:** Generate multiple summary formats
**Cost:** $ (cheap)
**Speed:** Fast

**Outputs:**
- **Short Summary** (150-200 chars) - Social media previews, search snippets
- **Medium Summary** (~300 chars) - Content cards, email previews
- **Long Summary** (~500 chars) - Landing pages, detailed overviews
- **Summary Markdown** (~30% of original) - Condensed version preserving structure

**Prompt Focus:**
- Active voice, present tense
- Value-oriented, actionable insights
- Technical terminology where appropriate
- Self-contained (no "this article" references)

---

### 2. SEO Metadata Agent
**Model:** OpenAI GPT-4o-mini
**Purpose:** Generate search-optimized metadata
**Cost:** $ (cheap)
**Speed:** Fast

**Outputs:**
- **Meta Title** (50-60 chars) - Keyword-rich, power words
- **Meta Description** (150-160 chars) - Action-oriented with CTA
- **SEO Keywords** (5-10 keywords) - Mix of primary and long-tail

**Prompt Focus:**
- Traditional search engine optimization (Google, Bing)
- Natural language, no keyword stuffing
- Match user search intent
- Front-load value proposition

---

### 3. Category Classification Agent
**Model:** Anthropic Claude 3 Haiku
**Purpose:** Classify content into approved categories
**Cost:** $ (cheap)
**Speed:** Very fast

**Outputs:**
- **Category** - Primary category from approved list
- **Confidence Score** (0.0-1.0) - Classification certainty
- **Alternate Categories** - Other potential fits

**Approved Categories:**
- Claude Skills
- PRDs
- Research
- Guides
- Tools
- General

**Prompt Focus:**
- Most specific category that fits
- Decision tree logic
- Clear reasoning for classification
- Confidence scoring guidelines

---

### 4. Tag Extraction Agent
**Model:** Anthropic Claude 3 Haiku
**Purpose:** Extract relevant tags and topics
**Cost:** $ (cheap)
**Speed:** Very fast

**Outputs:**
- **Tags** (3-5 primary tags) - Specific, searchable, lowercase-hyphenated
- **Related Topics** (3-5 topics) - Broader discovery topics

**Prompt Focus:**
- Specific over generic
- Technical accuracy
- Searchable format (e.g., "machine-learning", "api-design")
- Consider user search behavior

---

### 5. Schema.org Generator Agent
**Model:** OpenAI GPT-4o
**Purpose:** Generate AEO-optimized structured data
**Cost:** $$$ (expensive)
**Speed:** Moderate

**Outputs:**
- **Schema JSON-LD** - Complete structured data markup
- **Schema Types Used** - List of schema.org types (Article, BreadcrumbList, etc.)

**Included Schemas:**
- Article or TechArticle (primary)
- BreadcrumbList (navigation)
- Organization (publisher)
- Person (author)
- HowTo (if applicable)
- FAQPage (if Q&A format)

**Prompt Focus:**
- Answer Engine Optimization (ChatGPT, Perplexity, Claude)
- Traditional search engines (Google, Bing)
- All relevant properties, not just required ones
- Valid JSON-LD format

---

### 6. Image Prompt Agent
**Model:** Anthropic Claude 3.5 Sonnet
**Purpose:** Generate detailed image generation prompts
**Cost:** $$ (moderate)
**Speed:** Moderate

**Outputs:**
- **Image Prompt** (100-200 words) - Detailed prompt for AI image services
- **Style** - Visual style descriptor (e.g., "minimalist gradient")
- **Suggested Colors** - Color palette (3-5 hex codes)

**Target Specs:**
- 1200x630px (social sharing optimal)
- Professional, minimalist, modern aesthetic
- Abstract/conceptual (not literal screenshots)
- Category-specific visual metaphors

**Prompt Focus:**
- Detailed, specific prompts for fal.ai, DALL-E, Midjourney
- Abstract representation of technical concepts
- Professional color palettes (blues, purples, teals + vibrant accents)
- High quality, suitable for light/dark interfaces

---

### 7. Embeddings Agent
**Model:** OpenAI text-embedding-3-large
**Purpose:** Generate vector embeddings for semantic search
**Cost:** $$ (moderate)
**Speed:** Fast

**Outputs:**
- **Embedding** (3072 dimensions) - Vector representation
- **Model** - Model identifier used

**Usage:**
- Stored in `module_embeddings` table
- Enables semantic search
- Future: Chat interface for content discovery
- Combines title + full content (up to 32k chars)

**Fallback:** text-embedding-3-small if primary model fails

---

### 8. Validator Agent (Quality Gate)
**Model:** OpenAI GPT-4o
**Purpose:** Review all outputs and score quality
**Cost:** $$$ (expensive)
**Speed:** Moderate

**Outputs:**
- **Is Valid** (boolean) - Pass/fail result
- **Quality Score** (0-100) - Overall quality rating
- **Validation Report** - Detailed assessment
- **Issues** - List of problems found (error/warning/info)
- **Suggestions** - Improvement recommendations

**Validation Criteria:**
1. **Completeness** (25 pts) - All required fields present
2. **Accuracy** (25 pts) - Metadata reflects content truthfully
3. **Quality** (25 pts) - Well-written, engaging, professional
4. **Consistency** (25 pts) - No contradictions, consistent tone

**Scoring:**
- 90-100: Excellent - publish immediately
- 75-89: Good - minor improvements possible
- 60-74: Acceptable - some issues to address
- Below 60: Poor - needs significant work

---

## Workflow Execution

### Phase 1: Independent Agents (Parallel)
Run simultaneously for maximum speed:
- Summary Agent
- SEO Metadata Agent
- Category Classification Agent
- Tag Extraction Agent

### Phase 2: Dependent Agents (Parallel)
Run after Phase 1, use category/tags as input:
- Schema.org Generator Agent (needs category + tags)
- Image Prompt Agent (needs category + tags)
- Embeddings Agent (independent, runs in parallel)

### Phase 3: Validation (Sequential)
Runs after all agents complete:
- Validator Agent reviews all outputs
- Quality gate decision
- Generates final report

### Total Processing Time
Typical: **10-20 seconds** (most agents run in parallel)

---

## Cost Optimization

### Model Selection Strategy
- **Cheap models** (Gemini Flash, Claude Haiku) for simple tasks
  - Summaries, classification, tag extraction
- **Moderate models** (GPT-4o-mini, embeddings) for standard tasks
  - SEO metadata, vector generation
- **Premium models** (GPT-4o, Claude Sonnet) for complex tasks
  - Schema.org generation, creative prompts, validation

### Estimated Cost per Module
- Summary Agent: $0.001
- SEO Agent: $0.002
- Category Agent: $0.001
- Tag Agent: $0.001
- Schema Agent: $0.015
- Image Prompt Agent: $0.005
- Embeddings Agent: $0.013
- Validator Agent: $0.015

**Total: ~$0.053 per module** (approximately 5 cents)

---

## Configuration

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_openrouter_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WEBFLOW_API_TOKEN=your_webflow_token
```

### Model Configuration

Models are defined in `/src/agents/types.ts`:

```typescript
export const MODEL_CONFIG = {
  summary: 'google/gemini-flash-1.5',
  seo: 'openai/gpt-4o-mini',
  category: 'anthropic/claude-3-haiku',
  tags: 'anthropic/claude-3-haiku',
  schema: 'openai/gpt-4o',
  imagePrompt: 'anthropic/claude-3-5-sonnet',
  embeddings: 'openai/text-embedding-3-large',
  validator: 'openai/gpt-4o'
};
```

To change models, update this configuration object.

---

## Database Schema

### New Fields Added to `modules` Table

```sql
-- Agent-generated metadata
schema_json JSONB                 -- Schema.org JSON-LD markup
quality_score INTEGER             -- 0-100 quality rating
validation_report TEXT            -- Detailed validation report
meta_title TEXT                   -- SEO meta title
seo_keywords TEXT[]               -- SEO keywords array
summary_short TEXT                -- 150-200 char summary
summary_medium TEXT               -- ~300 char summary
summary_long TEXT                 -- ~500 char summary
image_prompt TEXT                 -- AI image generation prompt
```

### Embeddings Table

```sql
module_embeddings (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  embedding VECTOR(3072),         -- 3072 dimensions for text-embedding-3-large
  created_at TIMESTAMP
)
```

Run migration: `migrations/002_add_agent_fields.sql`

---

## Usage

### Basic Usage

Upload a markdown file via API:

```bash
curl -X POST http://localhost:3000/api/modules/upload \
  -F "file=@your-content.md"
```

The agent workflow runs automatically:
1. Reads markdown content
2. Executes all 7 agents in phases
3. Validates results
4. Stores in Supabase (as "draft" status)
5. Syncs to Webflow (as draft)
6. Returns results with quality score

### Programmatic Usage

```typescript
import { executeAgentWorkflow } from './agents/coordinator';

const results = await executeAgentWorkflow({
  title: 'My Content Title',
  content: markdownContent
});

console.log('Quality Score:', results.validation.qualityScore);
console.log('Category:', results.category.category);
console.log('Tags:', results.tags.tags);
```

---

## Observability

### Console Output

The workflow provides detailed console logging:

```
🚀 Starting Agent Workflow...
📄 Processing: Building AI-Powered Content Pipelines

📊 Phase 1: Running independent agents in parallel...
📝 Summary Agent: Generating summaries...
✅ Summary Agent: Summaries generated successfully
🔍 SEO Agent: Generating metadata...
✅ SEO Agent: Metadata generated successfully
...

✅ Phase 1 complete

📊 Phase 2: Running dependent agents...
...

📊 Phase 3: Validating results...
✅ Validator Agent: Quality score 87/100

─────────────────────────────────────────────────
🎯 Workflow Summary:
   Quality Score: 87/100
   Status: ✅ PASSED
   Processing Time: 12453ms
   Issues: 1
─────────────────────────────────────────────────
```

### Future: Mastra Dashboard

When fully integrated with Mastra:
- Real-time agent execution traces
- Performance metrics per agent
- Cost tracking
- Error rate monitoring
- A/B testing of prompts

---

## Error Handling

### Graceful Degradation

Each agent has fallback logic:
- **Summary Agent** → Simple text extraction
- **SEO Agent** → Title-based metadata
- **Category Agent** → Keyword-based inference
- **Tag Agent** → Common tech term matching
- **Schema Agent** → Basic Article schema
- **Image Prompt Agent** → Category-based defaults
- **Embeddings Agent** → Fallback to smaller model
- **Validator Agent** → Basic field checking

### Retry Logic

No automatic retries (to avoid cascading API costs). Instead:
- Fallbacks provide acceptable quality
- Validation flags low-quality outputs
- User can manually reprocess if needed

---

## Prompt Tuning

### Modifying Prompts

All prompts are in individual agent files:

- `/src/agents/summaryAgent.ts` - Summary generation
- `/src/agents/seoAgent.ts` - SEO metadata
- `/src/agents/categoryAgent.ts` - Classification
- `/src/agents/tagAgent.ts` - Tag extraction
- `/src/agents/schemaAgent.ts` - Schema.org markup
- `/src/agents/imagePromptAgent.ts` - Image prompts
- `/src/agents/validatorAgent.ts` - Quality validation

Edit the `SYSTEM_PROMPT` constant in each file to adjust behavior.

### Testing Prompts

1. Modify prompt in agent file
2. Save changes
3. Upload test markdown: `test-content.md`
4. Review outputs and quality score
5. Iterate until satisfied

---

## Future Enhancements

### Short-term
- [ ] Add human review queue for low-quality scores
- [ ] Implement prompt versioning and A/B testing
- [ ] Add agent performance monitoring dashboard
- [ ] Create admin UI for adjusting agent parameters

### Medium-term
- [ ] Add feedback loop for continuous improvement
- [ ] Implement batch processing for multiple files
- [ ] Add support for PDF and HTML inputs
- [ ] Create custom agents for specific content types

### Long-term
- [ ] Build chat interface using embeddings
- [ ] Implement recommendation engine
- [ ] Add multi-language support
- [ ] Create agent marketplace for custom workflows

---

## Troubleshooting

### Common Issues

**"OPENROUTER_API_KEY not set"**
- Add key to `.env` file
- Restart server

**"Embeddings Agent failed"**
- Check OPENAI_API_KEY is set
- Verify API quota not exceeded
- Check content length < 32k characters

**Low quality scores**
- Review validation report for specific issues
- Check if content is too short/generic
- Verify category is appropriate
- Review agent outputs individually

**Webflow sync fails**
- Ensure Webflow schema includes all custom fields
- Check that field names match exactly (e.g., "meta-title")
- Verify Webflow API token has write permissions

---

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for specific errors
3. Test with `test-content.md` to isolate issues
4. Check individual agent outputs in workflow logs

---

## Credits

Built with:
- [OpenRouter](https://openrouter.ai) - Multi-model LLM access
- [OpenAI](https://openai.com) - Embeddings (text-embedding-3-large)
- [Anthropic Claude](https://anthropic.com) - Classification & creative tasks
- [Google Gemini](https://ai.google.dev) - Fast summarization
- [Supabase](https://supabase.com) - Database & storage
- [Webflow](https://webflow.com) - CMS publishing
