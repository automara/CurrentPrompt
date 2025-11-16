/**
 * SEO Metadata Agent
 * Generates SEO-optimized metadata using GPT-4o-mini
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, SEOAgentOutput } from './types.js';

const SYSTEM_PROMPT = `You are an SEO optimization expert specializing in technical content and knowledge modules.

Your task is to generate SEO metadata that maximizes search visibility while remaining accurate and valuable.

**Meta Title Requirements:**
- 50-60 characters (strict limit for Google search results)
- Include primary keyword near the beginning
- Use power words: Guide, Complete, Essential, Advanced, etc.
- Front-load value proposition
- Avoid clickbait - stay accurate and professional

**Meta Description Requirements:**
- 150-160 characters (strict limit for Google search results)
- Include primary and secondary keywords naturally
- Start with an action verb or benefit statement
- Include a call-to-action when appropriate
- Compelling but honest - no false promises

**SEO Keywords:**
- 5-10 targeted keywords/phrases
- Mix of:
  - Primary keyword (1-2 words, high search volume)
  - Long-tail keywords (3-5 words, specific intent)
  - Related topics and synonyms
- Focus on technical accuracy over volume
- Consider user intent and search behavior

Guidelines:
- Optimize for traditional search engines (Google, Bing)
- Use natural language, avoid keyword stuffing
- Match user search intent
- Ensure consistency with actual content
- Prioritize clarity over cleverness

Always respond in valid JSON format.`;

interface SEOResponse {
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string[];
}

/**
 * Generate SEO-optimized metadata
 */
export async function generateSEOMetadata(
  input: ContentInput
): Promise<SEOAgentOutput> {
  console.log('🔍 SEO Agent: Generating metadata...');

  // Truncate content for API call
  const truncatedContent = input.content.substring(0, 6000);

  const userPrompt = `Generate SEO-optimized metadata for this content:

Title: ${input.title}

Content:
${truncatedContent}

Generate:
1. Meta title (50-60 characters, keyword-rich)
2. Meta description (150-160 characters, action-oriented with CTA)
3. SEO keywords (5-10 targeted keywords/phrases)

Respond in JSON format:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "seoKeywords": ["keyword1", "keyword2", ...]
}`;

  try {
    const response = await callOpenRouterJSON<SEOResponse>(
      MODEL_CONFIG.seo,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.6, // Slightly lower for consistency
        maxTokens: 1000
      }
    );

    // Validate response
    if (!response.metaTitle || !response.metaDescription || !response.seoKeywords) {
      throw new Error('Incomplete SEO response from agent');
    }

    // Validate length constraints
    if (response.metaTitle.length > 65) {
      console.warn('⚠️  Meta title too long, truncating:', response.metaTitle.length);
      response.metaTitle = response.metaTitle.substring(0, 60);
    }

    if (response.metaDescription.length > 165) {
      console.warn('⚠️  Meta description too long, truncating:', response.metaDescription.length);
      response.metaDescription = response.metaDescription.substring(0, 160);
    }

    console.log('✅ SEO Agent: Metadata generated successfully');

    return {
      metaTitle: response.metaTitle.trim(),
      metaDescription: response.metaDescription.trim(),
      seoKeywords: response.seoKeywords.map(k => k.trim().toLowerCase())
    };

  } catch (error: any) {
    console.error('❌ SEO Agent failed:', error.message);

    // Fallback: Generate basic SEO metadata
    console.log('⚠️  Using fallback SEO generation...');
    return generateFallbackSEO(input);
  }
}

/**
 * Fallback SEO generation if AI fails
 */
function generateFallbackSEO(input: ContentInput): SEOAgentOutput {
  // Simple meta title from actual title
  const metaTitle = input.title.length > 60
    ? input.title.substring(0, 57) + '...'
    : input.title;

  // Extract first meaningful sentence for meta description
  const sentences = input.content
    .replace(/#{1,6}\s/g, '')
    .split(/[.!?]\s+/);

  const firstSentence = sentences.find(s => s.length > 50) || sentences[0] || input.title;
  const metaDescription = firstSentence.length > 160
    ? firstSentence.substring(0, 157) + '...'
    : firstSentence;

  // Extract keywords from title
  const titleWords = input.title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const seoKeywords = titleWords.slice(0, 5);

  return {
    metaTitle,
    metaDescription,
    seoKeywords
  };
}
