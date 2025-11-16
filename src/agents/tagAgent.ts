/**
 * Tag Extraction Agent
 * Extracts relevant tags and topics using Claude Haiku
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, TagAgentOutput } from './types.js';

const SYSTEM_PROMPT = `You are an expert content tagging specialist with deep knowledge of technical topics, programming, AI, and knowledge management.

Your task is to extract relevant tags and related topics from content.

**Tag Requirements:**
- Generate 3-5 primary tags
- Tags should be:
  - Specific and descriptive (not too generic)
  - Lowercase, hyphenated format (e.g., "machine-learning", "api-design")
  - Single words or short phrases (1-3 words max)
  - Technical accuracy over popularity
  - Searchable and discoverable

**Tag Categories to Consider:**
- Technologies (javascript, python, react, postgresql)
- Concepts (async-programming, dependency-injection, design-patterns)
- Domains (web-development, data-science, devops, security)
- Tools (git, docker, vscode, postman)
- Methodologies (agile, tdd, continuous-integration)

**Related Topics:**
- Additional 3-5 broader or related topics
- Help with content discovery and navigation
- Can be more general than primary tags
- Connect to related knowledge areas

**Guidelines:**
- Avoid overly generic tags (e.g., "programming", "technology")
- Prefer specific over broad (e.g., "react-hooks" over "react")
- Include both obvious and insightful tags
- Consider what users would search for
- Maintain consistency with existing tagging patterns

Always respond in valid JSON format.`;

interface TagResponse {
  tags: string[];
  relatedTopics: string[];
  reasoning?: string;
}

/**
 * Extract relevant tags from content
 */
export async function extractTags(
  input: ContentInput
): Promise<TagAgentOutput> {
  console.log('🏷️  Tag Agent: Extracting tags...');

  // Truncate content for API call
  const truncatedContent = input.content.substring(0, 5000);

  const userPrompt = `Extract relevant tags and related topics from this content:

Title: ${input.title}

Content:
${truncatedContent}

Generate:
1. Primary tags (3-5 specific, searchable tags in lowercase-hyphenated format)
2. Related topics (3-5 broader topics for discovery)

Respond in JSON format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "relatedTopics": ["topic1", "topic2", "topic3"]
}`;

  try {
    const response = await callOpenRouterJSON<TagResponse>(
      MODEL_CONFIG.tags,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.5,
        maxTokens: 1000
      }
    );

    // Validate response
    if (!response.tags || !Array.isArray(response.tags)) {
      throw new Error('Invalid tags response from agent');
    }

    // Normalize tags
    const normalizedTags = response.tags
      .map(tag => normalizeTag(tag))
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags

    const normalizedTopics = (response.relatedTopics || [])
      .map(topic => normalizeTag(topic))
      .filter(topic => topic.length > 0)
      .slice(0, 5);

    console.log(`✅ Tag Agent: Extracted ${normalizedTags.length} tags`);

    return {
      tags: normalizedTags,
      relatedTopics: normalizedTopics
    };

  } catch (error: any) {
    console.error('❌ Tag Agent failed:', error.message);

    // Fallback: Extract tags from content
    console.log('⚠️  Using fallback tag extraction...');
    return extractFallbackTags(input);
  }
}

/**
 * Normalize tag format
 */
function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // Remove special chars except hyphens
    .replace(/\s+/g, '-')          // Convert spaces to hyphens
    .replace(/-+/g, '-')           // Remove duplicate hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Fallback tag extraction using keyword matching
 */
function extractFallbackTags(input: ContentInput): TagAgentOutput {
  const combinedText = (input.title + ' ' + input.content.substring(0, 3000)).toLowerCase();

  // Common technical keywords to look for
  const techKeywords = [
    'javascript', 'typescript', 'python', 'react', 'node',
    'api', 'rest', 'graphql', 'database', 'sql', 'nosql',
    'docker', 'kubernetes', 'aws', 'cloud', 'serverless',
    'machine-learning', 'ai', 'claude', 'openai', 'llm',
    'testing', 'ci-cd', 'devops', 'security', 'authentication',
    'frontend', 'backend', 'full-stack', 'web-development',
    'microservices', 'architecture', 'design-patterns',
    'git', 'github', 'version-control'
  ];

  const foundTags = techKeywords.filter(keyword =>
    combinedText.includes(keyword.replace(/-/g, ' ')) ||
    combinedText.includes(keyword.replace(/-/g, ''))
  ).slice(0, 5);

  // If no tech keywords found, extract from title
  if (foundTags.length === 0) {
    const titleWords = input.title
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .map(word => normalizeTag(word))
      .slice(0, 3);

    foundTags.push(...titleWords);
  }

  return {
    tags: foundTags.length > 0 ? foundTags : ['general'],
    relatedTopics: ['documentation', 'knowledge-base']
  };
}
