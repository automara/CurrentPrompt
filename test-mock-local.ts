/**
 * Local Mock Test - Tests processing logic without requiring server or external services
 *
 * This demonstrates:
 * 1. Reading markdown content
 * 2. Extracting metadata (title, structure)
 * 3. Simulating agent processing
 * 4. Generating expected outputs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MockModule {
  id: string;
  title: string;
  slug: string;
  content: string;
  wordCount: number;
  characterCount: number;
  headings: string[];
  codeBlocks: number;
  estimatedReadTime: number;
  metadata: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasCodeExamples: boolean;
    hasList: boolean;
  };
}

class LocalMockTest {
  /**
   * Read and analyze the mock markdown file
   */
  async analyzeMarkdownFile(): Promise<MockModule> {
    console.log('📖 Reading and analyzing mock markdown file...\n');

    const filePath = path.join(__dirname, 'test-mock.md');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Extract all headings
    const headings = Array.from(content.matchAll(/^#{1,6}\s+(.+)$/gm))
      .map(match => match[1]);

    // Count words and characters
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;

    // Count code blocks
    const codeBlocks = (content.match(/```/g) || []).length / 2;

    // Estimated read time (200 words per minute)
    const estimatedReadTime = Math.ceil(wordCount / 200);

    // Check for structural elements
    const metadata = {
      hasIntroduction: content.toLowerCase().includes('## introduction'),
      hasConclusion: content.toLowerCase().includes('## conclusion'),
      hasCodeExamples: codeBlocks > 0,
      hasList: /^[\*\-]\s/m.test(content),
    };

    return {
      id: `mock-${Date.now()}`,
      title,
      slug,
      content,
      wordCount,
      characterCount,
      headings,
      codeBlocks,
      estimatedReadTime,
      metadata,
    };
  }

  /**
   * Simulate AI agent processing
   */
  simulateAgentProcessing(module: MockModule): Record<string, any> {
    console.log('🤖 Simulating AI agent processing...\n');

    // Mock Summary Agent
    const summaryAgent = {
      short: `${module.title} - A comprehensive guide covering key concepts and implementation.`,
      medium: `This guide explores ${module.title.toLowerCase()}, covering fundamental concepts, implementation patterns, and best practices. It includes practical examples and code snippets to help developers build production-ready solutions.`,
      long: `An in-depth exploration of ${module.title.toLowerCase()}. The guide covers core concepts, architecture patterns, implementation steps, security considerations, and performance optimization. With ${module.codeBlocks} code examples and ${module.wordCount} words of detailed explanation, this resource provides comprehensive coverage for developers at all levels.`,
    };

    // Mock SEO Agent
    const seoAgent = {
      metaTitle: `${module.title} - Complete Guide & Best Practices`,
      metaDescription: summaryAgent.medium.slice(0, 160),
      keywords: this.extractKeywords(module.title, module.headings),
    };

    // Mock Category Agent
    const categoryAgent = {
      category: this.categorizeContent(module.title, module.content),
      confidence: 0.92,
    };

    // Mock Tag Agent
    const tagAgent = {
      tags: this.extractTags(module.title, module.headings),
      relevanceScores: {},
    };

    // Mock Schema Agent
    const schemaAgent = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: module.title,
      description: summaryAgent.medium,
      wordCount: module.wordCount,
      articleBody: summaryAgent.long,
      datePublished: new Date().toISOString(),
    };

    // Mock Image Prompt Agent
    const imagePromptAgent = {
      prompt: `Professional technical illustration showing ${module.title.toLowerCase()}, featuring modern software architecture diagrams, clean minimalist design, blue and white color scheme, isometric view, high quality digital art`,
      style: 'technical-illustration',
      aspectRatio: '16:9',
    };

    // Mock Embeddings Agent
    const embeddingsAgent = {
      model: 'text-embedding-3-large',
      dimensions: 3072,
      // Mock embedding vector (first 10 dimensions)
      embedding: Array.from({ length: 10 }, () => Math.random() * 2 - 1),
      embeddingPreview: '[-0.0234, 0.1567, -0.0892, ...]',
    };

    // Mock Validator Agent
    const validatorAgent = {
      qualityScore: this.calculateQualityScore(module),
      issues: this.detectIssues(module),
      recommendations: [
        'Content is well-structured with clear headings',
        'Includes practical code examples',
        'Covers implementation, best practices, and optimization',
      ],
    };

    return {
      summary: summaryAgent,
      seo: seoAgent,
      category: categoryAgent,
      tags: tagAgent,
      schema: schemaAgent,
      imagePrompt: imagePromptAgent,
      embeddings: embeddingsAgent,
      validation: validatorAgent,
    };
  }

  /**
   * Extract keywords from title and headings
   */
  private extractKeywords(title: string, headings: string[]): string[] {
    const text = [title, ...headings].join(' ').toLowerCase();
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'to', 'in', 'on', 'at']);

    const keywords = text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Categorize content based on title and content
   */
  private categorizeContent(title: string, content: string): string {
    const text = (title + ' ' + content).toLowerCase();

    const categories = {
      'DevOps': ['docker', 'kubernetes', 'deployment', 'ci/cd', 'container'],
      'Backend': ['api', 'server', 'database', 'microservice'],
      'Frontend': ['react', 'vue', 'angular', 'component', 'ui'],
      'Security': ['security', 'authentication', 'encryption', 'vulnerability'],
      'Performance': ['optimization', 'performance', 'scaling', 'caching'],
    };

    let bestCategory = 'General';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((sum, keyword) =>
        sum + (text.split(keyword).length - 1), 0
      );

      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Extract tags from title and headings
   */
  private extractTags(title: string, headings: string[]): string[] {
    const keywords = this.extractKeywords(title, headings);
    return keywords.slice(0, 5).map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    );
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(module: MockModule): number {
    let score = 60; // Base score

    // Add points for structure
    if (module.metadata.hasIntroduction) score += 5;
    if (module.metadata.hasConclusion) score += 5;
    if (module.headings.length >= 5) score += 10;

    // Add points for content
    if (module.wordCount > 500) score += 5;
    if (module.wordCount > 1000) score += 5;
    if (module.metadata.hasCodeExamples) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Detect potential issues
   */
  private detectIssues(module: MockModule): string[] {
    const issues: string[] = [];

    if (module.wordCount < 300) {
      issues.push('Content is relatively short');
    }

    if (!module.metadata.hasIntroduction) {
      issues.push('Missing introduction section');
    }

    if (!module.metadata.hasConclusion) {
      issues.push('Missing conclusion section');
    }

    if (module.codeBlocks === 0) {
      issues.push('No code examples included');
    }

    return issues;
  }

  /**
   * Simulate file storage paths
   */
  simulateStorage(slug: string, version: number = 1): Record<string, string> {
    const baseUrl = 'https://fhuocowvfrwjygxgzelw.supabase.co/storage/v1/object/public/modules';
    const basePath = `${slug}/v${version}`;

    return {
      fullMarkdown: `${baseUrl}/${basePath}/full.md`,
      summaryMarkdown: `${baseUrl}/${basePath}/summary.md`,
      bundle: `${baseUrl}/${basePath}/bundle.zip`,
      thumbnail: `${baseUrl}/${basePath}/thumbnail.png`,
    };
  }

  /**
   * Run the complete mock test
   */
  async run(): Promise<void> {
    console.log('🧪 Local Mock Test - Markdown Processing Simulation\n');
    console.log('═'.repeat(70));
    console.log('\n');

    try {
      // Step 1: Analyze markdown
      const module = await this.analyzeMarkdownFile();

      console.log('📄 Module Analysis:');
      console.log('─'.repeat(70));
      console.log(`Title:              ${module.title}`);
      console.log(`Slug:               ${module.slug}`);
      console.log(`Module ID:          ${module.id}`);
      console.log(`Word Count:         ${module.wordCount}`);
      console.log(`Character Count:    ${module.characterCount}`);
      console.log(`Code Blocks:        ${module.codeBlocks}`);
      console.log(`Estimated Read:     ${module.estimatedReadTime} min`);
      console.log(`Headings Found:     ${module.headings.length}`);
      console.log('\n');

      console.log('📑 Content Structure:');
      console.log('─'.repeat(70));
      module.headings.slice(0, 5).forEach((heading, i) => {
        console.log(`  ${i + 1}. ${heading}`);
      });
      if (module.headings.length > 5) {
        console.log(`  ... and ${module.headings.length - 5} more`);
      }
      console.log('\n');

      // Step 2: Simulate agent processing
      const agentResults = this.simulateAgentProcessing(module);

      console.log('🤖 AI Agent Processing Results:');
      console.log('─'.repeat(70));
      console.log('\n1️⃣  Summary Agent:');
      console.log(`    Short:  ${agentResults.summary.short}`);
      console.log(`    Medium: ${agentResults.summary.medium.slice(0, 80)}...`);
      console.log('\n');

      console.log('2️⃣  SEO Agent:');
      console.log(`    Meta Title:       ${agentResults.seo.metaTitle}`);
      console.log(`    Meta Description: ${agentResults.seo.metaDescription.slice(0, 80)}...`);
      console.log(`    Keywords:         ${agentResults.seo.keywords.join(', ')}`);
      console.log('\n');

      console.log('3️⃣  Category Agent:');
      console.log(`    Category:   ${agentResults.category.category}`);
      console.log(`    Confidence: ${(agentResults.category.confidence * 100).toFixed(1)}%`);
      console.log('\n');

      console.log('4️⃣  Tag Agent:');
      console.log(`    Tags: ${agentResults.tags.tags.join(', ')}`);
      console.log('\n');

      console.log('5️⃣  Schema Agent:');
      console.log(`    Type:       ${agentResults.schema['@type']}`);
      console.log(`    Word Count: ${agentResults.schema.wordCount}`);
      console.log('\n');

      console.log('6️⃣  Image Prompt Agent:');
      console.log(`    Prompt: ${agentResults.imagePrompt.prompt.slice(0, 80)}...`);
      console.log(`    Style:  ${agentResults.imagePrompt.style}`);
      console.log('\n');

      console.log('7️⃣  Embeddings Agent:');
      console.log(`    Model:      ${agentResults.embeddings.model}`);
      console.log(`    Dimensions: ${agentResults.embeddings.dimensions}`);
      console.log(`    Preview:    ${agentResults.embeddings.embeddingPreview}`);
      console.log('\n');

      console.log('8️⃣  Validator Agent:');
      console.log(`    Quality Score: ${agentResults.validation.qualityScore}/100`);
      if (agentResults.validation.issues.length > 0) {
        console.log('    Issues:');
        agentResults.validation.issues.forEach(issue => {
          console.log(`      ⚠️  ${issue}`);
        });
      }
      console.log('    Recommendations:');
      agentResults.validation.recommendations.forEach(rec => {
        console.log(`      ✓ ${rec}`);
      });
      console.log('\n');

      // Step 3: Show storage paths
      const storagePaths = this.simulateStorage(module.slug);

      console.log('💾 Simulated Storage Paths:');
      console.log('─'.repeat(70));
      console.log(`Full Markdown:    ${storagePaths.fullMarkdown}`);
      console.log(`Summary Markdown: ${storagePaths.summaryMarkdown}`);
      console.log(`Bundle ZIP:       ${storagePaths.bundle}`);
      console.log(`Thumbnail:        ${storagePaths.thumbnail}`);
      console.log('\n');

      // Final summary
      console.log('═'.repeat(70));
      console.log('✅ LOCAL MOCK TEST COMPLETED SUCCESSFULLY');
      console.log('═'.repeat(70));
      console.log('\n');
      console.log('Summary of Processing:');
      console.log(`  • Analyzed ${module.wordCount} words across ${module.headings.length} sections`);
      console.log(`  • Generated ${Object.keys(agentResults).length} agent outputs`);
      console.log(`  • Quality Score: ${agentResults.validation.qualityScore}/100`);
      console.log(`  • Category: ${agentResults.category.category}`);
      console.log(`  • Tags: ${agentResults.tags.tags.join(', ')}`);
      console.log('\n');
      console.log('This demonstrates the full processing pipeline that would occur');
      console.log('when submitting this markdown file through the actual API.');
      console.log('\n');

    } catch (error) {
      console.error('❌ Test failed:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }
}

// Run the test
const test = new LocalMockTest();
test.run();
