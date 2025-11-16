/**
 * Schema.org Generator Agent
 * Generates AEO-optimized Schema.org JSON-LD markup using GPT-4o
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, SchemaAgentOutput } from './types.js';

const SYSTEM_PROMPT = `You are an expert in Schema.org structured data and Answer Engine Optimization (AEO).

Your task is to generate comprehensive Schema.org JSON-LD markup that maximizes visibility in:
- Traditional search engines (Google, Bing)
- AI answer engines (ChatGPT, Perplexity, Claude)
- Voice assistants and featured snippets

**Required Schema Types:**

1. **Article or TechArticle** (primary)
   - Use TechArticle for technical content
   - Use Article for general content
   - Include: headline, description, datePublished, dateModified, author, publisher

2. **BreadcrumbList**
   - Navigation hierarchy
   - Helps with site structure understanding

3. **Organization** (publisher)
   - Publisher information
   - Establishes authority

4. **Person** (author)
   - Author credentials
   - Builds trust

**AEO Optimization Guidelines:**
- Use specific schema types (TechArticle > Article when applicable)
- Include all relevant properties, not just required ones
- Add educational properties (teaches, educationalLevel, learningResourceType)
- Include accessibility properties when relevant
- Use itemListElement for structured lists
- Add FAQPage schema if content has Q&A format
- Include HowTo schema for step-by-step guides

**JSON-LD Format:**
- Valid JSON-LD syntax
- Use @context: "https://schema.org"
- Use @graph array for multiple entities
- Include @type for all entities
- Add meaningful @id values

**Quality Checks:**
- All required properties present
- URLs properly formatted
- Dates in ISO 8601 format
- Valid schema.org types
- No deprecated properties

Always respond in valid JSON format containing the JSON-LD markup.`;

interface SchemaResponse {
  jsonLd: object;
  schemaTypes: string[];
  reasoning?: string;
}

/**
 * Generate Schema.org JSON-LD markup
 */
export async function generateSchema(
  input: ContentInput,
  category: string,
  tags: string[]
): Promise<SchemaAgentOutput> {
  console.log('📋 Schema Agent: Generating Schema.org markup...');

  // Truncate content for API call
  const truncatedContent = input.content.substring(0, 6000);

  const userPrompt = `Generate comprehensive Schema.org JSON-LD markup for this content.

Title: ${input.title}
Category: ${category}
Tags: ${tags.join(', ')}

Content:
${truncatedContent}

Generate JSON-LD markup that includes:
1. Primary schema (Article or TechArticle based on content type)
2. BreadcrumbList for navigation
3. Organization (publisher: CurrentPrompt)
4. Person (author: Keith Armstrong)
5. Additional relevant schemas (HowTo, FAQPage, etc. if applicable)

Optimize for AEO - include all relevant properties for answer engines.

Respond in JSON format:
{
  "jsonLd": {
    "@context": "https://schema.org",
    "@graph": [...]
  },
  "schemaTypes": ["Article", "BreadcrumbList", "Organization", "Person"]
}`;

  try {
    const response = await callOpenRouterJSON<SchemaResponse>(
      MODEL_CONFIG.schema,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.4,
        maxTokens: 3000
      }
    );

    // Validate response
    if (!response.jsonLd || !response.schemaTypes) {
      throw new Error('Incomplete schema response from agent');
    }

    console.log(`✅ Schema Agent: Generated ${response.schemaTypes.length} schema types`);

    return {
      schemaJson: response.jsonLd,
      schemaTypes: response.schemaTypes
    };

  } catch (error: any) {
    console.error('❌ Schema Agent failed:', error.message);

    // Fallback: Generate basic schema
    console.log('⚠️  Using fallback schema generation...');
    return generateFallbackSchema(input, category, tags);
  }
}

/**
 * Fallback schema generation
 */
function generateFallbackSchema(
  input: ContentInput,
  category: string,
  tags: string[]
): SchemaAgentOutput {
  const now = new Date().toISOString();
  const slug = input.slug || input.title.toLowerCase().replace(/\s+/g, '-');

  // Determine if technical content
  const isTechnical = category === 'Tools' ||
    category === 'Claude Skills' ||
    tags.some(tag => ['javascript', 'python', 'api', 'code', 'programming'].includes(tag));

  const articleType = isTechnical ? 'TechArticle' : 'Article';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': articleType,
        '@id': `https://currentprompt.com/modules/${slug}#article`,
        headline: input.title,
        description: input.content.substring(0, 200).replace(/\n/g, ' '),
        datePublished: now,
        dateModified: now,
        author: {
          '@type': 'Person',
          '@id': 'https://currentprompt.com/#keith-armstrong',
          name: 'Keith Armstrong'
        },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://currentprompt.com/#organization',
          name: 'CurrentPrompt',
          url: 'https://currentprompt.com'
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://currentprompt.com/modules/${slug}`
        },
        ...(isTechnical && {
          proficiencyLevel: 'Beginner',
          dependencies: tags.join(', ')
        }),
        keywords: tags.join(', '),
        about: {
          '@type': 'Thing',
          name: category
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://currentprompt.com/modules/${slug}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://currentprompt.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Modules',
            item: 'https://currentprompt.com/modules'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: category,
            item: `https://currentprompt.com/modules?category=${encodeURIComponent(category)}`
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: input.title,
            item: `https://currentprompt.com/modules/${slug}`
          }
        ]
      },
      {
        '@type': 'Organization',
        '@id': 'https://currentprompt.com/#organization',
        name: 'CurrentPrompt',
        url: 'https://currentprompt.com',
        description: 'Automated markdown module publishing platform'
      },
      {
        '@type': 'Person',
        '@id': 'https://currentprompt.com/#keith-armstrong',
        name: 'Keith Armstrong',
        url: 'https://currentprompt.com'
      }
    ]
  };

  return {
    schemaJson: jsonLd,
    schemaTypes: [articleType, 'BreadcrumbList', 'Organization', 'Person']
  };
}
