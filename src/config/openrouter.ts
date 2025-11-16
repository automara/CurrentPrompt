/**
 * OpenRouter configuration and client setup
 */

import OpenAI from 'openai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not set - agent-based content generation will fail');
}

/**
 * OpenRouter client configured to use OpenAI SDK
 * Works with all OpenRouter models via OpenAI-compatible API
 */
export const openrouterClient = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://currentprompt.com', // Optional - for rankings
    'X-Title': 'CurrentPrompt Content Generator'  // Optional - for rankings
  }
});

/**
 * Call OpenRouter with a specific model
 */
export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  } = {}
): Promise<string> {
  try {
    const response = await openrouterClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      ...(options.responseFormat && { response_format: options.responseFormat })
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    return content;
  } catch (error: any) {
    console.error(`❌ OpenRouter API error (model: ${model}):`, error.message);
    throw error;
  }
}

/**
 * Call OpenRouter and parse JSON response
 */
export async function callOpenRouterJSON<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const content = await callOpenRouter(
    model,
    systemPrompt,
    userPrompt,
    {
      ...options,
      responseFormat: { type: 'json_object' }
    }
  );

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('❌ Failed to parse JSON from OpenRouter:', content);
    throw new Error('Invalid JSON response from OpenRouter');
  }
}

/**
 * Test OpenRouter connection
 */
export async function testOpenRouterConnection(): Promise<boolean> {
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not configured');
    return false;
  }

  try {
    await callOpenRouter(
      'openai/gpt-4o-mini',
      'You are a helpful assistant.',
      'Reply with "OK" if you can read this message.',
      { maxTokens: 10 }
    );
    console.log('✅ OpenRouter connection successful');
    return true;
  } catch (error) {
    console.error('❌ OpenRouter connection failed:', error);
    return false;
  }
}
