/**
 * Test script for agent workflow
 * Run with: npx ts-node --esm test-agents.ts
 */

import { config } from 'dotenv';
import { executeAgentWorkflow } from './src/agents/coordinator.js';
import fs from 'fs/promises';

// Load environment variables
config();

async function testAgentWorkflow() {
  console.log('🧪 Testing Agent Workflow\n');
  console.log('Environment Check:');
  console.log('  OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is required. Set it in .env file.');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required for embeddings. Set it in .env file.');
    process.exit(1);
  }

  try {
    // Read test content
    const content = await fs.readFile('./test-content.md', 'utf-8');
    const title = 'Building AI-Powered Content Pipelines with Claude';

    console.log('📄 Test Content:');
    console.log(`   Title: ${title}`);
    console.log(`   Length: ${content.length} characters\n`);

    // Execute workflow
    const startTime = Date.now();
    const results = await executeAgentWorkflow({
      title,
      content
    });
    const duration = Date.now() - startTime;

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ Summary Agent:');
    console.log(`   Short: ${results.summary.summaryShort}`);
    console.log(`   Medium: ${results.summary.summaryMedium.substring(0, 100)}...`);
    console.log(`   Long: ${results.summary.summaryLong.substring(0, 100)}...`);

    console.log('\n🔍 SEO Agent:');
    console.log(`   Meta Title: ${results.seo.metaTitle}`);
    console.log(`   Meta Description: ${results.seo.metaDescription}`);
    console.log(`   Keywords: ${results.seo.seoKeywords.join(', ')}`);

    console.log('\n🏷️  Category Agent:');
    console.log(`   Category: ${results.category.category}`);
    console.log(`   Confidence: ${(results.category.confidence * 100).toFixed(1)}%`);
    if (results.category.alternateCategories) {
      console.log(`   Alternates: ${results.category.alternateCategories.join(', ')}`);
    }

    console.log('\n🏷️  Tag Agent:');
    console.log(`   Tags: ${results.tags.tags.join(', ')}`);
    console.log(`   Related: ${results.tags.relatedTopics.join(', ')}`);

    console.log('\n📋 Schema Agent:');
    console.log(`   Types: ${results.schema.schemaTypes.join(', ')}`);
    console.log(`   JSON-LD Size: ${JSON.stringify(results.schema.schemaJson).length} bytes`);

    console.log('\n🎨 Image Prompt Agent:');
    console.log(`   Prompt: ${results.imagePrompt.imagePrompt.substring(0, 150)}...`);
    console.log(`   Style: ${results.imagePrompt.style}`);
    console.log(`   Colors: ${results.imagePrompt.suggestedColors.join(', ')}`);

    console.log('\n🧬 Embeddings Agent:');
    console.log(`   Dimensions: ${results.embeddings.embedding.length}`);
    console.log(`   Model: ${results.embeddings.model}`);

    console.log('\n✓ Validator Agent:');
    console.log(`   Valid: ${results.validation.isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Quality Score: ${results.validation.qualityScore}/100`);
    console.log(`   Issues: ${results.validation.issues.length}`);

    if (results.validation.issues.length > 0) {
      console.log('\n   Issues Found:');
      results.validation.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`     ${icon} [${issue.field}] ${issue.message}`);
      });
    }

    if (results.validation.suggestions.length > 0) {
      console.log('\n   Suggestions:');
      results.validation.suggestions.forEach(s => console.log(`     • ${s}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`⏱️  Total Processing Time: ${duration}ms`);
    console.log('='.repeat(60));

    console.log('\n✅ Test completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testAgentWorkflow();
