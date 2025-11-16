/**
 * Test route for agent workflow
 * POST /api/test-agents with JSON body containing title and content
 */

import { Router, Request, Response } from 'express';
import { executeAgentWorkflow } from '../agents/coordinator.js';

const router = Router();

/**
 * Test the agent workflow with custom content
 * POST /api/test-agents
 * Body: { title: string, content: string }
 */
router.post('/test-agents', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide both title and content in the request body'
      });
    }

    console.log(`\n🧪 Testing agents for: ${title}`);

    const startTime = Date.now();
    const results = await executeAgentWorkflow({ title, content });
    const duration = Date.now() - startTime;

    // Return comprehensive results
    res.json({
      success: true,
      processingTime: duration,
      results: {
        summary: {
          short: results.summary.summaryShort,
          medium: results.summary.summaryMedium,
          long: results.summary.summaryLong,
          markdownLength: results.summary.summaryMarkdown.length
        },
        seo: {
          metaTitle: results.seo.metaTitle,
          metaDescription: results.seo.metaDescription,
          keywords: results.seo.seoKeywords
        },
        category: {
          category: results.category.category,
          confidence: results.category.confidence,
          alternates: results.category.alternateCategories
        },
        tags: {
          tags: results.tags.tags,
          relatedTopics: results.tags.relatedTopics
        },
        schema: {
          types: results.schema.schemaTypes,
          jsonSize: JSON.stringify(results.schema.schemaJson).length
        },
        imagePrompt: {
          prompt: results.imagePrompt.imagePrompt,
          style: results.imagePrompt.style,
          colors: results.imagePrompt.suggestedColors
        },
        embeddings: {
          dimensions: results.embeddings.embedding.length,
          model: results.embeddings.model
        },
        validation: {
          isValid: results.validation.isValid,
          qualityScore: results.validation.qualityScore,
          issuesCount: results.validation.issues.length,
          issues: results.validation.issues,
          suggestions: results.validation.suggestions,
          report: results.validation.validationReport
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Agent test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Simple health check for agents
 * GET /api/test-agents/health
 */
router.get('/test-agents/health', (req: Request, res: Response) => {
  const envCheck = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  res.json({
    status: 'ok',
    agents: 'ready',
    environment: envCheck,
    ready: envCheck.openrouter && envCheck.openai
  });
});

export default router;
