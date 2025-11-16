/**
 * Validator Agent
 * Reviews all agent outputs and scores quality using GPT-4o
 */

import { callOpenRouterJSON } from '../config/openrouter.js';
import { MODEL_CONFIG, ValidationAgentOutput, ValidationIssue } from './types.js';

const SYSTEM_PROMPT = `You are a meticulous quality assurance specialist reviewing AI-generated content metadata.

Your task is to validate that all required fields are present, accurate, and high-quality.

**Validation Criteria:**

1. **Completeness** (25 points)
   - All required fields present
   - No empty or null values
   - All arrays have appropriate length

2. **Accuracy** (25 points)
   - Summaries accurately reflect content
   - Category is appropriate
   - Tags are relevant
   - SEO metadata is truthful (no clickbait)

3. **Quality** (25 points)
   - Summaries are well-written and engaging
   - Meta descriptions have clear CTAs
   - Tags are specific (not too generic)
   - Schema.org markup is comprehensive

4. **Consistency** (25 points)
   - Tone is consistent across fields
   - No contradictions between fields
   - Terminology is consistent
   - Character limits are respected

**Scoring:**
- 90-100: Excellent - publish immediately
- 75-89: Good - minor improvements possible
- 60-74: Acceptable - some issues to address
- Below 60: Poor - needs significant work

**Issue Severity:**
- ERROR: Critical issues that block publishing
- WARNING: Important issues that should be fixed
- INFO: Minor suggestions for improvement

Your response should include:
1. Overall quality score (0-100)
2. Validation result (pass/fail)
3. List of issues found
4. Improvement suggestions
5. Detailed validation report

Always respond in valid JSON format.`;

interface ValidatorInput {
  title: string;
  summaryShort: string;
  summaryMedium: string;
  summaryLong: string;
  summaryMarkdown: string;
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string[];
  category: string;
  categoryConfidence: number;
  tags: string[];
  schemaTypes: string[];
  imagePrompt: string;
  hasEmbeddings: boolean;
}

interface ValidatorResponse {
  isValid: boolean;
  qualityScore: number;
  issues: ValidationIssue[];
  suggestions: string[];
  report: string;
}

/**
 * Validate all agent outputs
 */
export async function validateContent(
  input: ValidatorInput
): Promise<ValidationAgentOutput> {
  console.log('✓ Validator Agent: Reviewing content quality...');

  const userPrompt = `Review this AI-generated content metadata for quality and completeness.

**Title:** ${input.title}

**Summary Short:** ${input.summaryShort}
**Summary Medium:** ${input.summaryMedium}
**Summary Long:** ${input.summaryLong}

**Meta Title:** ${input.metaTitle}
**Meta Description:** ${input.metaDescription}
**SEO Keywords:** ${input.seoKeywords.join(', ')}

**Category:** ${input.category} (confidence: ${input.categoryConfidence})
**Tags:** ${input.tags.join(', ')}

**Schema Types:** ${input.schemaTypes.join(', ')}
**Image Prompt:** ${input.imagePrompt.substring(0, 200)}...
**Has Embeddings:** ${input.hasEmbeddings ? 'Yes' : 'No'}

Validate:
1. Completeness - all required fields present and populated
2. Accuracy - metadata accurately reflects the content
3. Quality - well-written, engaging, professional
4. Consistency - no contradictions, consistent tone

Provide:
1. Overall quality score (0-100)
2. Pass/fail validation result
3. List of issues (if any) with severity (error/warning/info)
4. Improvement suggestions
5. Detailed validation report

Respond in JSON format:
{
  "isValid": true/false,
  "qualityScore": 85,
  "issues": [
    {"field": "metaTitle", "severity": "warning", "message": "..."}
  ],
  "suggestions": ["...", "..."],
  "report": "Detailed validation report..."
}`;

  try {
    const response = await callOpenRouterJSON<ValidatorResponse>(
      MODEL_CONFIG.validator,
      SYSTEM_PROMPT,
      userPrompt,
      {
        temperature: 0.3, // Low temperature for consistent validation
        maxTokens: 2000
      }
    );

    // Ensure quality score is in valid range
    const qualityScore = Math.max(0, Math.min(100, response.qualityScore));

    console.log(`✅ Validator Agent: Quality score ${qualityScore}/100`);

    if (!response.isValid || qualityScore < 60) {
      console.warn(`⚠️  Validation issues found (${response.issues.length} issues)`);
    }

    return {
      isValid: response.isValid && qualityScore >= 60,
      qualityScore,
      validationReport: response.report || 'No detailed report provided',
      issues: response.issues || [],
      suggestions: response.suggestions || []
    };

  } catch (error: any) {
    console.error('❌ Validator Agent failed:', error.message);

    // Fallback: Basic validation
    console.log('⚠️  Using fallback validation...');
    return performBasicValidation(input);
  }
}

/**
 * Fallback basic validation
 */
function performBasicValidation(input: ValidatorInput): ValidationAgentOutput {
  const issues: ValidationIssue[] = [];
  let score = 100;

  // Check required fields
  if (!input.summaryShort || input.summaryShort.length < 50) {
    issues.push({
      field: 'summaryShort',
      severity: 'error',
      message: 'Summary short is missing or too short'
    });
    score -= 15;
  }

  if (!input.metaTitle || input.metaTitle.length < 30) {
    issues.push({
      field: 'metaTitle',
      severity: 'error',
      message: 'Meta title is missing or too short'
    });
    score -= 15;
  }

  if (!input.metaDescription || input.metaDescription.length < 100) {
    issues.push({
      field: 'metaDescription',
      severity: 'error',
      message: 'Meta description is missing or too short'
    });
    score -= 15;
  }

  if (!input.category) {
    issues.push({
      field: 'category',
      severity: 'error',
      message: 'Category is missing'
    });
    score -= 15;
  }

  if (!input.tags || input.tags.length === 0) {
    issues.push({
      field: 'tags',
      severity: 'warning',
      message: 'No tags provided'
    });
    score -= 10;
  }

  if (!input.hasEmbeddings) {
    issues.push({
      field: 'embeddings',
      severity: 'warning',
      message: 'Embeddings not generated'
    });
    score -= 10;
  }

  // Check character limits
  if (input.metaTitle.length > 65) {
    issues.push({
      field: 'metaTitle',
      severity: 'warning',
      message: `Meta title too long (${input.metaTitle.length} chars, max 60)`
    });
    score -= 5;
  }

  if (input.metaDescription.length > 165) {
    issues.push({
      field: 'metaDescription',
      severity: 'warning',
      message: `Meta description too long (${input.metaDescription.length} chars, max 160)`
    });
    score -= 5;
  }

  const isValid = score >= 60 && !issues.some(i => i.severity === 'error');

  return {
    isValid,
    qualityScore: Math.max(0, score),
    validationReport: `Basic validation completed. ${issues.length} issues found.`,
    issues,
    suggestions: isValid
      ? ['Content passed basic validation']
      : ['Address errors before publishing', 'Review and fix all critical issues']
  };
}
