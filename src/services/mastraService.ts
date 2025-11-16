import OpenAI from 'openai';

/**
 * Mastra Service - AI-powered content generation for modules
 *
 * Generates:
 * - Professional summaries
 * - SEO-optimized meta titles and descriptions
 * - Category suggestions
 * - Relevant tags
 * - Summary markdown versions
 */

interface ContentGenerationResult {
  title: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  tags: string[];
  summaryMarkdown: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are an expert content strategist and technical writer specializing in knowledge module curation.

Your tasks:
1. Generate professional, concise summaries (150-200 characters)
2. Create SEO-optimized meta titles and descriptions
3. Suggest accurate categories from: Claude Skills, PRDs, Research, Guides, Tools, General
4. Extract 3-5 relevant tags
5. Create condensed summary markdown versions

Guidelines:
- Summaries should be clear, engaging, and value-focused
- Meta titles should be 50-60 characters, keyword-rich
- Meta descriptions should be 150-160 characters, action-oriented
- Categories must be precise and from the approved list
- Tags should be lowercase, single words or short phrases
- Summary markdown should preserve key information in ~30% of original length

Always respond in valid JSON format.`;

/**
 * Generate all content metadata for a markdown module
 */
export async function generateContentMetadata(
  title: string,
  content: string
): Promise<ContentGenerationResult> {
  try {
    console.log(`🤖 Using OpenAI to generate metadata for: ${title}`);

    const prompt = `Analyze this markdown module and generate metadata:

Title: ${title}

Content:
${content.substring(0, 3000)} ${content.length > 3000 ? '...(truncated)' : ''}

Generate:
1. A refined title (if the current one needs improvement)
2. A compelling summary (150-200 chars)
3. An SEO meta title (50-60 chars)
4. An SEO meta description (150-160 chars)
5. The best category: Claude Skills, PRDs, Research, Guides, Tools, or General
6. 3-5 relevant tags (lowercase)
7. A condensed summary in markdown format (preserve headings and key points, ~30% of original)

Respond in JSON format:
{
  "title": "...",
  "summary": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "category": "...",
  "tags": ["...", "..."],
  "summaryMarkdown": "..."
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    console.log(`✓ Generated content metadata for: ${title}`);

    return {
      title: result.title || title,
      summary: result.summary,
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      category: result.category || 'General',
      tags: result.tags || [],
      summaryMarkdown: result.summaryMarkdown || '',
    };
  } catch (error) {
    console.error('Error generating content metadata:', error);

    // Return fallback metadata if OpenAI fails
    return generateFallbackMetadata(title, content);
  }
}

/**
 * Generate summary markdown only (faster operation)
 */
export async function generateSummaryMarkdown(
  content: string
): Promise<string> {
  try {
    const prompt = `Create a condensed summary version of this markdown content.

Preserve:
- Main title and subtitle
- Key section headings (##)
- Important bullet points
- Code examples (if critical)

Remove:
- Verbose explanations
- Redundant sections
- Excessive detail

Target: ~30% of original length while maintaining all key information.

Content:
${content}

Respond with only the markdown summary (no JSON, no explanation).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || generateSimpleSummary(content);
  } catch (error) {
    console.error('Error generating summary markdown:', error);
    return generateSimpleSummary(content);
  }
}

/**
 * Generate SEO metadata only
 */
export async function generateSEOMetadata(
  title: string,
  content: string
): Promise<{ metaTitle: string; metaDescription: string; keywords: string[] }> {
  try {
    const prompt = `Generate SEO metadata for this content:

Title: ${title}
Content: ${content.substring(0, 2000)}

Generate:
1. SEO meta title (50-60 characters, keyword-rich)
2. SEO meta description (150-160 characters, compelling)
3. 5-10 keywords for search optimization

Respond in JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      keywords: result.keywords || [],
    };
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    return {
      metaTitle: title.substring(0, 60),
      metaDescription: content.substring(0, 160),
      keywords: [],
    };
  }
}

/**
 * Fallback metadata generation (no AI)
 */
function generateFallbackMetadata(
  title: string,
  content: string
): ContentGenerationResult {
  const lines = content.split('\n');
  const firstParagraph = lines.find(
    (line) => line.trim().length > 50 && !line.startsWith('#')
  );

  const summary = firstParagraph?.substring(0, 200) ||
    'A curated knowledge module from CurrentPrompt';

  return {
    title,
    summary,
    metaTitle: title.substring(0, 60),
    metaDescription: summary.substring(0, 160),
    category: inferCategory(content, title),
    tags: extractBasicTags(content),
    summaryMarkdown: generateSimpleSummary(content),
  };
}

/**
 * Simple summary generation (no AI)
 */
function generateSimpleSummary(content: string): string {
  const lines = content.split('\n');
  const summaryLines: string[] = [];
  let sectionCount = 0;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      summaryLines.push(line);
    } else if (line.startsWith('## ')) {
      if (sectionCount < 3) {
        summaryLines.push(line);
        sectionCount++;
      } else {
        break;
      }
    } else if (sectionCount > 0 && line.trim()) {
      summaryLines.push(line);
    }
  }

  return summaryLines.join('\n');
}

/**
 * Infer category from content
 */
function inferCategory(content: string, title: string): string {
  const lower = (content + ' ' + title).toLowerCase();

  if (lower.includes('skill') || lower.includes('claude')) {
    return 'Claude Skills';
  }
  if (lower.includes('prd') || lower.includes('product requirement')) {
    return 'PRDs';
  }
  if (lower.includes('research') || lower.includes('paper')) {
    return 'Research';
  }
  if (lower.includes('guide') || lower.includes('tutorial')) {
    return 'Guides';
  }
  if (lower.includes('tool') || lower.includes('utility')) {
    return 'Tools';
  }

  return 'General';
}

/**
 * Extract basic tags from content
 */
function extractBasicTags(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();

  const techTerms = [
    'ai', 'claude', 'ux', 'design', 'development',
    'automation', 'productivity', 'debugging', 'testing',
    'api', 'webflow', 'typescript', 'javascript', 'react',
    'node', 'python', 'prompt', 'skill',
  ];

  for (const term of techTerms) {
    if (lower.includes(term)) {
      tags.push(term);
    }
  }

  return tags.slice(0, 5);
}
