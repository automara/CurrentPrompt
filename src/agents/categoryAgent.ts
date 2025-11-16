/**
 * Category Classification Agent
 * Classifies content into approved categories using Claude Haiku
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, CategoryAgentOutput, APPROVED_CATEGORIES } from './types.js';

const SYSTEM_PROMPT = `You are an expert content categorization specialist with deep knowledge of technical documentation, development resources, and knowledge management.

Your task is to classify content into the most appropriate category from an approved list.

**Approved Categories:**
1. **Claude Skills** - Skills, techniques, and best practices for working with Claude AI
2. **PRDs** - Product Requirements Documents, feature specifications, project plans
3. **Research** - Research findings, analysis, experiments, data studies
4. **Guides** - How-to guides, tutorials, step-by-step instructions
5. **Tools** - Tool documentation, software utilities, development tools
6. **General** - Everything else that doesn't fit other categories

**Classification Guidelines:**
- Choose the MOST specific category that fits
- Consider primary purpose over secondary topics
- When uncertain, provide alternate categories with reasoning
- Confidence score should reflect certainty (0.0-1.0)
  - 0.9-1.0: Clear, obvious fit
  - 0.7-0.89: Strong fit with minor ambiguity
  - 0.5-0.69: Reasonable fit but could go elsewhere
  - Below 0.5: Weak fit, consider alternatives

**Decision Tree:**
1. Is it about Claude AI specifically? → Claude Skills
2. Is it a requirements doc or spec? → PRDs
3. Is it research or analysis? → Research
4. Is it a step-by-step guide? → Guides
5. Is it tool documentation? → Tools
6. Otherwise → General

Always respond in valid JSON format.`;

interface CategoryResponse {
  category: string;
  confidence: number;
  reasoning: string;
  alternateCategories?: string[];
}

/**
 * Classify content into appropriate category
 */
export async function classifyCategory(
  input: ContentInput
): Promise<CategoryAgentOutput> {
  console.log('🏷️  Category Agent: Classifying content...');

  // Truncate content for API call (first 4000 chars should be enough for classification)
  const truncatedContent = input.content.substring(0, 4000);

  const userPrompt = `Classify this content into the most appropriate category.

Title: ${input.title}

Content:
${truncatedContent}

Approved categories:
${APPROVED_CATEGORIES.join(', ')}

Provide:
1. The best category from the approved list
2. Confidence score (0.0-1.0)
3. Brief reasoning for your choice
4. (Optional) Alternate categories if applicable

Respond in JSON format:
{
  "category": "...",
  "confidence": 0.95,
  "reasoning": "...",
  "alternateCategories": ["...", "..."]
}`;

  try {
    const response = await callOpenRouterJSON<CategoryResponse>(
      MODEL_CONFIG.category,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.3, // Low temperature for consistent classification
        maxTokens: 800
      }
    );

    // Validate response
    if (!response.category || response.confidence === undefined) {
      throw new Error('Incomplete category response from agent');
    }

    // Ensure category is from approved list
    if (!APPROVED_CATEGORIES.includes(response.category as any)) {
      console.warn(`⚠️  Agent returned unapproved category: ${response.category}`);
      // Try to map to closest approved category
      response.category = findClosestCategory(response.category);
    }

    console.log(`✅ Category Agent: Classified as "${response.category}" (confidence: ${response.confidence})`);

    return {
      category: response.category,
      confidence: response.confidence,
      alternateCategories: response.alternateCategories?.filter(
        c => APPROVED_CATEGORIES.includes(c as any)
      )
    };

  } catch (error: any) {
    console.error('❌ Category Agent failed:', error.message);

    // Fallback: Infer category from content
    console.log('⚠️  Using fallback category classification...');
    return inferCategoryFromContent(input);
  }
}

/**
 * Find closest approved category (fallback)
 */
function findClosestCategory(suggested: string): string {
  const lowerSuggested = suggested.toLowerCase();

  // Simple keyword matching
  if (lowerSuggested.includes('claude') || lowerSuggested.includes('skill')) {
    return 'Claude Skills';
  }
  if (lowerSuggested.includes('prd') || lowerSuggested.includes('requirement')) {
    return 'PRDs';
  }
  if (lowerSuggested.includes('research') || lowerSuggested.includes('study')) {
    return 'Research';
  }
  if (lowerSuggested.includes('guide') || lowerSuggested.includes('tutorial')) {
    return 'Guides';
  }
  if (lowerSuggested.includes('tool')) {
    return 'Tools';
  }

  return 'General';
}

/**
 * Fallback category inference from content keywords
 */
function inferCategoryFromContent(input: ContentInput): CategoryAgentOutput {
  const combinedText = (input.title + ' ' + input.content.substring(0, 2000)).toLowerCase();

  // Keyword-based classification
  const scores: Record<string, number> = {
    'Claude Skills': 0,
    'PRDs': 0,
    'Research': 0,
    'Guides': 0,
    'Tools': 0,
    'General': 0
  };

  // Claude Skills keywords
  if (combinedText.match(/claude|anthropic|prompt|skill|technique/)) scores['Claude Skills'] += 2;

  // PRDs keywords
  if (combinedText.match(/requirements?|specification|feature|epic|user story/)) scores['PRDs'] += 2;

  // Research keywords
  if (combinedText.match(/research|study|analysis|experiment|findings|data/)) scores['Research'] += 2;

  // Guides keywords
  if (combinedText.match(/how to|guide|tutorial|step|instruction|walkthrough/)) scores['Guides'] += 2;

  // Tools keywords
  if (combinedText.match(/tool|utility|software|application|framework|library/)) scores['Tools'] += 2;

  // Find highest scoring category
  const category = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];

  const confidence = scores[category] > 0 ? 0.6 : 0.3;

  return {
    category,
    confidence,
    alternateCategories: ['General']
  };
}
