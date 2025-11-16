/**
 * Content Summary Agent
 * Generates multiple summary formats using Gemini Flash
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, SummaryAgentOutput } from './types.js';

const SYSTEM_PROMPT = `You are an expert content strategist specializing in creating compelling summaries for knowledge modules.

Your task is to generate multiple summary formats from markdown content:

1. **Short Summary** (150-200 characters)
   - Perfect for social media previews, search snippets
   - Capture the core value proposition
   - Engaging and action-oriented

2. **Medium Summary** (~300 characters)
   - Ideal for content cards, email previews
   - Include key benefits and context
   - Clear and informative

3. **Long Summary** (~500 characters)
   - Detailed overview for landing pages
   - Cover main topics, approach, and outcomes
   - Professional and comprehensive

4. **Summary Markdown** (~30% of original length)
   - Condensed markdown version preserving structure
   - Keep: main title (H1), section headings (H2), key bullet points
   - Remove: verbose explanations, redundant examples, fluff
   - Maintain: code blocks, critical lists, essential links

Guidelines:
- Write in active voice, present tense
- Focus on value and actionable insights
- Use technical terminology appropriately
- Avoid marketing fluff and superlatives
- Ensure summaries are self-contained (no "this article" references)

Always respond in valid JSON format.`;

interface SummaryResponse {
  summaryShort: string;
  summaryMedium: string;
  summaryLong: string;
  summaryMarkdown: string;
}

/**
 * Generate comprehensive summaries from content
 */
export async function generateSummaries(
  input: ContentInput
): Promise<SummaryAgentOutput> {
  console.log('📝 Summary Agent: Generating summaries...');

  // Truncate content for API call (keep first 8000 chars for context)
  const truncatedContent = input.content.substring(0, 8000);

  const userPrompt = `Generate comprehensive summaries for this content:

Title: ${input.title}

Content:
${truncatedContent}

Generate:
1. A short summary (150-200 characters)
2. A medium summary (~300 characters)
3. A long summary (~500 characters)
4. A condensed markdown version (~30% of original length, preserving structure)

Respond in JSON format:
{
  "summaryShort": "...",
  "summaryMedium": "...",
  "summaryLong": "...",
  "summaryMarkdown": "..."
}`;

  try {
    const response = await callOpenRouterJSON<SummaryResponse>(
      MODEL_CONFIG.summary,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.7,
        maxTokens: 2500
      }
    );

    // Validate response
    if (!response.summaryShort || !response.summaryMedium ||
        !response.summaryLong || !response.summaryMarkdown) {
      throw new Error('Incomplete summary response from agent');
    }

    console.log('✅ Summary Agent: Summaries generated successfully');

    return {
      summaryShort: response.summaryShort.trim(),
      summaryMedium: response.summaryMedium.trim(),
      summaryLong: response.summaryLong.trim(),
      summaryMarkdown: response.summaryMarkdown.trim()
    };

  } catch (error: any) {
    console.error('❌ Summary Agent failed:', error.message);

    // Fallback: Generate basic summaries
    console.log('⚠️  Using fallback summary generation...');
    return generateFallbackSummaries(input);
  }
}

/**
 * Fallback summary generation if AI fails
 */
function generateFallbackSummaries(input: ContentInput): SummaryAgentOutput {
  const contentPreview = input.content
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/[*_`]/g, '')     // Remove formatting
    .replace(/\n+/g, ' ')      // Replace newlines with spaces
    .trim();

  return {
    summaryShort: contentPreview.substring(0, 180) + '...',
    summaryMedium: contentPreview.substring(0, 280) + '...',
    summaryLong: contentPreview.substring(0, 480) + '...',
    summaryMarkdown: input.content.substring(0, Math.floor(input.content.length * 0.3))
  };
}
