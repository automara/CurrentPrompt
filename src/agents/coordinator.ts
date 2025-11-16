/**
 * Agent Workflow Coordinator
 * Orchestrates all content generation agents in parallel/sequential execution
 */

import { generateSummaries } from './summaryAgent.js';
import { generateSEOMetadata } from './seoAgent.js';
import { classifyCategory } from './categoryAgent.js';
import { extractTags } from './tagAgent.js';
import { generateSchema } from './schemaAgent.js';
import { generateImagePrompt } from './imagePromptAgent.js';
import { generateEmbeddingsWithFallback } from './embeddingsAgent.js';
import { validateContent } from './validatorAgent.js';
import type {
  ContentInput,
  AgentWorkflowOutput,
  SummaryAgentOutput,
  SEOAgentOutput,
  CategoryAgentOutput,
  TagAgentOutput,
  SchemaAgentOutput,
  ImagePromptAgentOutput,
  EmbeddingsAgentOutput,
  ValidationAgentOutput
} from './types.js';

/**
 * Execute complete agent workflow
 * Runs agents in parallel where possible, then validates the results
 */
export async function executeAgentWorkflow(
  input: ContentInput
): Promise<AgentWorkflowOutput> {
  const startTime = Date.now();

  console.log('\n🚀 Starting Agent Workflow...');
  console.log(`📄 Processing: ${input.title}`);
  console.log('─'.repeat(60));

  try {
    // PHASE 1: Parallel execution of independent agents
    console.log('\n📊 Phase 1: Running independent agents in parallel...');

    const [
      summaryResult,
      seoResult,
      categoryResult,
      tagsResult
    ] = await Promise.allSettled([
      generateSummaries(input),
      generateSEOMetadata(input),
      classifyCategory(input),
      extractTags(input)
    ]);

    // Extract results or use defaults
    const summary: SummaryAgentOutput = summaryResult.status === 'fulfilled'
      ? summaryResult.value
      : getDefaultSummary(input);

    const seo: SEOAgentOutput = seoResult.status === 'fulfilled'
      ? seoResult.value
      : getDefaultSEO(input);

    const category: CategoryAgentOutput = categoryResult.status === 'fulfilled'
      ? categoryResult.value
      : { category: 'General', confidence: 0.5 };

    const tags: TagAgentOutput = tagsResult.status === 'fulfilled'
      ? tagsResult.value
      : { tags: ['general'], relatedTopics: [] };

    console.log('✅ Phase 1 complete');

    // PHASE 2: Dependent agents (need category and tags)
    console.log('\n📊 Phase 2: Running dependent agents...');

    const [
      schemaResult,
      imagePromptResult,
      embeddingsResult
    ] = await Promise.allSettled([
      generateSchema(input, category.category, tags.tags),
      generateImagePrompt(input, category.category, tags.tags),
      generateEmbeddingsWithFallback(input)
    ]);

    const schema: SchemaAgentOutput = schemaResult.status === 'fulfilled'
      ? schemaResult.value
      : { schemaJson: {}, schemaTypes: [] };

    const imagePrompt: ImagePromptAgentOutput = imagePromptResult.status === 'fulfilled'
      ? imagePromptResult.value
      : getDefaultImagePrompt(category.category);

    const embeddings: EmbeddingsAgentOutput = embeddingsResult.status === 'fulfilled'
      ? embeddingsResult.value
      : { embedding: [], model: 'none' };

    console.log('✅ Phase 2 complete');

    // PHASE 3: Validation (quality gate)
    console.log('\n📊 Phase 3: Validating results...');

    const validation: ValidationAgentOutput = await validateContent({
      title: input.title,
      summaryShort: summary.summaryShort,
      summaryMedium: summary.summaryMedium,
      summaryLong: summary.summaryLong,
      summaryMarkdown: summary.summaryMarkdown,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      seoKeywords: seo.seoKeywords,
      category: category.category,
      categoryConfidence: category.confidence,
      tags: tags.tags,
      schemaTypes: schema.schemaTypes,
      imagePrompt: imagePrompt.imagePrompt,
      hasEmbeddings: embeddings.embedding.length > 0
    });

    console.log('✅ Phase 3 complete');

    // Calculate total processing time
    const totalProcessingTime = Date.now() - startTime;

    console.log('\n' + '─'.repeat(60));
    console.log('🎯 Workflow Summary:');
    console.log(`   Quality Score: ${validation.qualityScore}/100`);
    console.log(`   Status: ${validation.isValid ? '✅ PASSED' : '⚠️  ISSUES FOUND'}`);
    console.log(`   Processing Time: ${totalProcessingTime}ms`);
    console.log(`   Issues: ${validation.issues.length}`);
    console.log('─'.repeat(60) + '\n');

    // Log any validation issues
    if (validation.issues.length > 0) {
      console.log('⚠️  Validation Issues:');
      validation.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${issue.field}] ${issue.message}`);
      });
      console.log('');
    }

    return {
      summary,
      seo,
      category,
      tags,
      schema,
      imagePrompt,
      embeddings,
      validation,
      processedAt: new Date().toISOString(),
      totalProcessingTime
    };

  } catch (error: any) {
    console.error('❌ Workflow failed:', error.message);
    throw error;
  }
}

/**
 * Default summary fallback
 */
function getDefaultSummary(input: ContentInput): SummaryAgentOutput {
  const preview = input.content.substring(0, 180);
  return {
    summaryShort: preview,
    summaryMedium: input.content.substring(0, 280),
    summaryLong: input.content.substring(0, 480),
    summaryMarkdown: input.content.substring(0, Math.floor(input.content.length * 0.3))
  };
}

/**
 * Default SEO fallback
 */
function getDefaultSEO(input: ContentInput): SEOAgentOutput {
  return {
    metaTitle: input.title.substring(0, 60),
    metaDescription: input.content.substring(0, 160),
    seoKeywords: []
  };
}

/**
 * Default image prompt fallback
 */
function getDefaultImagePrompt(category: string): ImagePromptAgentOutput {
  return {
    imagePrompt: `Professional ${category} content visualization with modern minimalist design`,
    style: 'minimalist gradient',
    suggestedColors: ['#667eea', '#764ba2', '#00d4ff']
  };
}
