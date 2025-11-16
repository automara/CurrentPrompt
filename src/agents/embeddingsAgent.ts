/**
 * Embeddings Agent
 * Generates vector embeddings using OpenAI's text-embedding-3-large
 */

import OpenAI from 'openai';
import { ContentInput, EmbeddingsAgentOutput } from './types.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - embeddings generation will fail');
}

const openaiClient = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * Generate vector embeddings from content
 */
export async function generateEmbeddings(
  input: ContentInput
): Promise<EmbeddingsAgentOutput> {
  console.log('🧬 Embeddings Agent: Generating embeddings...');

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Prepare text for embedding (combine title and content)
    // Limit to ~8000 tokens (~32000 characters for safety)
    const combinedText = `${input.title}\n\n${input.content}`.substring(0, 32000);

    // Generate embedding using OpenAI
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-large',
      input: combinedText,
      encoding_format: 'float'
    });

    const embedding = response.data[0].embedding;

    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding returned from OpenAI');
    }

    console.log(`✅ Embeddings Agent: Generated ${embedding.length}-dimensional embedding`);

    return {
      embedding,
      model: 'text-embedding-3-large'
    };

  } catch (error: any) {
    console.error('❌ Embeddings Agent failed:', error.message);
    throw error; // Don't fallback for embeddings - they're critical for search
  }
}

/**
 * Generate embeddings with fallback to smaller model
 */
export async function generateEmbeddingsWithFallback(
  input: ContentInput
): Promise<EmbeddingsAgentOutput> {
  try {
    return await generateEmbeddings(input);
  } catch (error: any) {
    console.log('⚠️  Trying fallback model: text-embedding-3-small...');

    try {
      const combinedText = `${input.title}\n\n${input.content}`.substring(0, 32000);

      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: combinedText,
        encoding_format: 'float'
      });

      const embedding = response.data[0].embedding;

      console.log(`✅ Embeddings Agent: Generated ${embedding.length}-dimensional embedding (small model)`);

      return {
        embedding,
        model: 'text-embedding-3-small'
      };
    } catch (fallbackError: any) {
      console.error('❌ Fallback embeddings also failed:', fallbackError.message);
      throw fallbackError;
    }
  }
}
