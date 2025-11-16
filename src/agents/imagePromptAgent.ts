/**
 * Image Prompt Agent
 * Generates detailed image prompts using Claude Sonnet
 */

import { callOpenRouter } from '../config/openrouter.js';
import { MODEL_CONFIG, ContentInput, ImagePromptAgentOutput } from './types.js';

const SYSTEM_PROMPT = `You are an expert visual designer and AI image prompt engineer specializing in creating professional, technical content imagery.

Your task is to generate detailed image prompts for AI image generation services (fal.ai, DALL-E, Midjourney, etc.).

**Image Requirements:**
- Dimensions: 1200x630px (optimal for social sharing and thumbnails)
- Style: Professional, minimalist, modern
- Aesthetic: Clean, technical, brand-consistent
- Purpose: Visual representation of technical content/concepts

**Prompt Components:**

1. **Subject/Concept**
   - Main visual metaphor for the content
   - Abstract representation of technical concepts
   - Avoid literal computer screens or stock imagery

2. **Style & Aesthetic**
   - Minimalist gradient backgrounds
   - Geometric shapes and patterns
   - Modern, clean design language
   - Professional color palette

3. **Color Palette**
   - Primary: Deep blues, purples, teals
   - Accent: Vibrant oranges, pinks, cyans
   - Background: Gradients, subtle patterns
   - Avoid: Harsh colors, busy patterns

4. **Technical Specifications**
   - High quality, sharp details
   - Professional composition
   - Good contrast and readability
   - Suitable for both light/dark interfaces

**Prompt Formula:**
"[Subject/Concept] in a [style] style, featuring [visual elements], [color palette], [mood/atmosphere], high quality, professional design, 1200x630 aspect ratio"

**Examples:**
- "Abstract data visualization with flowing neural network patterns in a minimalist style, featuring geometric nodes and connections, gradient of deep purple to cyan, modern and professional, high quality render"
- "Conceptual representation of code architecture as floating geometric blocks in a clean minimal style, soft gradient background from navy to teal, professional and technical aesthetic"

Your prompts should be:
- Specific and detailed (100-200 words)
- Focused on abstract/conceptual representation
- Aligned with professional tech branding
- Optimized for AI image generation

Provide the complete prompt as a single paragraph, plus style descriptor and color suggestions.`;

interface ImagePromptResponse {
  prompt: string;
  style: string;
  colors: string[];
}

/**
 * Generate image prompt for content
 */
export async function generateImagePrompt(
  input: ContentInput,
  category: string,
  tags: string[]
): Promise<ImagePromptAgentOutput> {
  console.log('🎨 Image Prompt Agent: Generating prompt...');

  // Truncate content for API call
  const truncatedContent = input.content.substring(0, 4000);

  const userPrompt = `Generate a detailed image prompt for AI image generation services.

Title: ${input.title}
Category: ${category}
Tags: ${tags.join(', ')}

Content Preview:
${truncatedContent}

Create a detailed prompt for generating a professional thumbnail image (1200x630px) that:
1. Visually represents the content's core concept
2. Uses abstract/conceptual imagery (not literal screenshots)
3. Follows a minimalist, modern aesthetic
4. Uses professional color palette (blues, purples, teals, with vibrant accents)
5. Is optimized for social sharing and content discovery

Provide:
1. Complete detailed prompt (100-200 words)
2. Style descriptor (e.g., "minimalist gradient", "geometric abstract")
3. Suggested color palette (3-5 colors)

Format as plain text, not JSON. Start with the complete prompt, then on new lines provide:
Style: [style descriptor]
Colors: [color1, color2, color3]`;

  try {
    const response = await callOpenRouter(
      MODEL_CONFIG.imagePrompt,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.8, // Higher for creativity
        maxTokens: 1000
      }
    );

    // Parse response
    const parsed = parseImagePromptResponse(response);

    console.log('✅ Image Prompt Agent: Prompt generated successfully');

    return parsed;

  } catch (error: any) {
    console.error('❌ Image Prompt Agent failed:', error.message);

    // Fallback: Generate basic prompt
    console.log('⚠️  Using fallback image prompt generation...');
    return generateFallbackImagePrompt(input, category);
  }
}

/**
 * Parse image prompt response
 */
function parseImagePromptResponse(response: string): ImagePromptAgentOutput {
  const lines = response.trim().split('\n');

  // First line(s) are the prompt
  const promptLines: string[] = [];
  let styleLine = '';
  let colorsLine = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('style:')) {
      styleLine = trimmed.substring(6).trim();
    } else if (trimmed.toLowerCase().startsWith('colors:')) {
      colorsLine = trimmed.substring(7).trim();
    } else if (trimmed.length > 0) {
      promptLines.push(trimmed);
    }
  }

  const imagePrompt = promptLines.join(' ').trim();
  const style = styleLine || 'minimalist gradient';
  const suggestedColors = colorsLine
    ? colorsLine.split(',').map(c => c.trim())
    : ['#667eea', '#764ba2', '#f093fb'];

  return {
    imagePrompt,
    style,
    suggestedColors
  };
}

/**
 * Fallback image prompt generation
 */
function generateFallbackImagePrompt(
  input: ContentInput,
  category: string
): ImagePromptAgentOutput {
  // Category-based visual concepts
  const categoryVisuals: Record<string, string> = {
    'Claude Skills': 'abstract AI neural network patterns with flowing connections',
    'PRDs': 'geometric blueprint-style layout with clean lines and structure',
    'Research': 'data visualization with graphs and analytical elements',
    'Guides': 'step-by-step pathway or journey visualization with directional flow',
    'Tools': 'modular building blocks or toolbox arrangement with geometric shapes',
    'General': 'abstract knowledge representation with interconnected nodes'
  };

  const visual = categoryVisuals[category] || categoryVisuals['General'];

  const imagePrompt = `${visual} in a modern minimalist style, featuring a smooth gradient background from deep purple (#667eea) to cyan (#00d4ff), professional and clean design, high quality render, 1200x630 aspect ratio, suitable for technical content thumbnail`;

  return {
    imagePrompt,
    style: 'minimalist gradient',
    suggestedColors: ['#667eea', '#764ba2', '#00d4ff']
  };
}
