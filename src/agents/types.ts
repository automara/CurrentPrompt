/**
 * Shared types for content generation agents
 */

export interface ContentInput {
  title: string;
  content: string;
  slug?: string;
}

export interface SummaryAgentOutput {
  summaryShort: string;      // 150-200 characters for previews
  summaryMedium: string;      // ~300 characters for cards
  summaryLong: string;        // ~500 characters for detailed views
  summaryMarkdown: string;    // Condensed markdown version (~30% of original)
}

export interface SEOAgentOutput {
  metaTitle: string;          // 50-60 characters, keyword-rich
  metaDescription: string;    // 150-160 characters, action-oriented
  seoKeywords: string[];      // 5-10 targeted keywords
}

export interface CategoryAgentOutput {
  category: string;           // Primary category from approved list
  confidence: number;         // Confidence score 0-1
  alternateCategories?: string[]; // Other potential categories
}

export interface TagAgentOutput {
  tags: string[];             // 3-5 relevant tags
  relatedTopics: string[];    // Additional related topics
}

export interface SchemaAgentOutput {
  schemaJson: object;         // Schema.org JSON-LD markup
  schemaTypes: string[];      // Schema types used (Article, TechArticle, etc.)
}

export interface ImagePromptAgentOutput {
  imagePrompt: string;        // Detailed prompt for image generation
  style: string;              // Visual style (minimalist, gradient, etc.)
  suggestedColors: string[];  // Color palette suggestions
}

export interface EmbeddingsAgentOutput {
  embedding: number[];        // Vector embedding (1536 dimensions for OpenAI)
  model: string;              // Model used for embedding generation
}

export interface ValidationAgentOutput {
  isValid: boolean;           // Overall validation result
  qualityScore: number;       // Quality score 0-100
  validationReport: string;   // Detailed validation report
  issues: ValidationIssue[];  // List of issues found
  suggestions: string[];      // Improvement suggestions
}

export interface ValidationIssue {
  field: string;              // Field with issue
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface AgentWorkflowOutput {
  // Individual agent outputs
  summary: SummaryAgentOutput;
  seo: SEOAgentOutput;
  category: CategoryAgentOutput;
  tags: TagAgentOutput;
  schema: SchemaAgentOutput;
  imagePrompt: ImagePromptAgentOutput;
  embeddings: EmbeddingsAgentOutput;
  validation: ValidationAgentOutput;

  // Metadata
  processedAt: string;
  totalProcessingTime: number; // milliseconds
}

export interface ModuleData {
  // Original fields
  title: string;
  slug: string;
  category: string;
  tags: string[];
  summary?: string;
  meta_description?: string;

  // New agent-generated fields
  schema_json?: object;
  quality_score?: number;
  validation_report?: string;
  meta_title?: string;
  seo_keywords?: string[];
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  image_prompt?: string;

  // Other fields
  source_url?: string;
  source_label?: string;
  owner: string;
  status: 'draft' | 'published' | 'archived';
}

// Approved categories (from existing system)
export const APPROVED_CATEGORIES = [
  'Claude Skills',
  'PRDs',
  'Research',
  'Guides',
  'Tools',
  'General'
] as const;

export type ApprovedCategory = typeof APPROVED_CATEGORIES[number];

// Model configurations for OpenRouter
export const MODEL_CONFIG = {
  summary: 'google/gemini-flash-1.5',           // Fast, cheap summarization
  seo: 'openai/gpt-4o-mini',                    // SEO optimization
  category: 'anthropic/claude-3-haiku',         // Classification
  tags: 'anthropic/claude-3-haiku',             // Tag extraction
  schema: 'openai/gpt-4o',                      // Complex structured output
  imagePrompt: 'anthropic/claude-3-5-sonnet',   // Creative prompts
  embeddings: 'openai/text-embedding-3-large',  // Vector embeddings (direct OpenAI)
  validator: 'openai/gpt-4o'                    // Quality validation
} as const;
