#!/bin/bash

# Test script for Railway deployment
# Usage: ./test-railway.sh <railway-url>
# Example: ./test-railway.sh https://currentprompt-production.up.railway.app

RAILWAY_URL="${1:-http://localhost:3000}"

echo "🚀 Testing CurrentPrompt Agents on Railway"
echo "URL: $RAILWAY_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -s "$RAILWAY_URL/health" | jq '.'
echo ""

# Test 2: Agent health check
echo "2️⃣  Testing agent health..."
curl -s "$RAILWAY_URL/api/test-agents/health" | jq '.'
echo ""

# Test 3: Run agent workflow
echo "3️⃣  Testing agent workflow with sample content..."
curl -s -X POST "$RAILWAY_URL/api/test-agents" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Building AI-Powered Content Pipelines",
    "content": "# Building AI-Powered Content Pipelines\n\n## Introduction\n\nCreating automated content generation systems requires careful orchestration of multiple AI agents, each specialized in their domain. This guide explores how to build a robust content pipeline using Claude AI and modern development practices.\n\n## Core Concepts\n\n### Agent Specialization\n\nRather than using a single monolithic AI for all tasks, specialized agents excel at specific functions:\n\n- **Content Analysis Agents** - Extract meaning and structure from raw content\n- **SEO Optimization Agents** - Generate search-engine friendly metadata\n- **Classification Agents** - Categorize and tag content accurately\n- **Quality Validation Agents** - Ensure consistency and completeness\n\n### Workflow Orchestration\n\nThe key to effective AI pipelines is proper orchestration:\n\n1. **Parallel Execution** - Run independent agents simultaneously for speed\n2. **Sequential Dependencies** - Execute dependent tasks in proper order\n3. **Error Handling** - Graceful degradation when individual agents fail\n4. **Quality Gates** - Validation checkpoints before publishing\n\n## Best Practices\n\n- Use specific models for each task\n- Monitor costs and performance\n- Implement retry logic\n- Cache common operations\n- Track quality scores over time"
  }' | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "To test on Railway:"
echo "  1. Get your Railway URL from the dashboard"
echo "  2. Run: ./test-railway.sh https://your-app.up.railway.app"
echo ""
echo "Expected results:"
echo "  - Health: status 'ok'"
echo "  - Agent Health: openrouter and openai should be true"
echo "  - Agent Workflow: quality score 70-95"
