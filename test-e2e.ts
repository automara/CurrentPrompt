/**
 * End-to-End Test Script for Markdown Processing Pipeline
 *
 * This script demonstrates the complete flow:
 * 1. Read markdown file
 * 2. Send to API endpoint
 * 3. Monitor processing
 * 4. Verify results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModuleCreateRequest {
  title?: string;
  content: string;
  autoSync?: boolean;
}

interface ModuleCreateResponse {
  success: boolean;
  message: string;
  moduleId?: string;
  error?: string;
}

class E2ETest {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:3000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Step 1: Read the mock markdown file
   */
  async readMockFile(): Promise<string> {
    console.log('📖 Step 1: Reading mock markdown file...');
    const filePath = path.join(__dirname, 'test-mock.md');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Mock file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`✓ Successfully read ${content.length} characters from test-mock.md`);

    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Test Module';
    console.log(`✓ Extracted title: "${title}"`);

    return content;
  }

  /**
   * Step 2: Submit to API
   */
  async submitToAPI(content: string, title?: string): Promise<ModuleCreateResponse> {
    console.log('\n🚀 Step 2: Submitting to API...');

    const endpoint = `${this.baseUrl}/api/modules/create`;
    const payload: ModuleCreateRequest = {
      content,
      title,
      autoSync: false, // Don't sync to Webflow in test
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    console.log(`📡 POST ${endpoint}`);
    console.log(`📦 Payload size: ${JSON.stringify(payload).length} bytes`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json() as ModuleCreateResponse;

      if (!response.ok) {
        console.error(`❌ API Error (${response.status}):`, data.error);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message || 'Unknown error',
        };
      }

      console.log(`✓ Successfully submitted to API`);
      console.log(`✓ Module ID: ${data.moduleId}`);

      return data;
    } catch (error) {
      console.error('❌ Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to API',
      };
    }
  }

  /**
   * Step 3: Check server health
   */
  async checkHealth(): Promise<boolean> {
    console.log('\n🏥 Step 3: Checking server health...');

    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();

      if (data.status === 'ok') {
        console.log('✓ Server is healthy');
        console.log(`✓ Server time: ${data.timestamp}`);
        return true;
      }

      console.error('❌ Server unhealthy:', data);
      return false;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Step 4: Check agent health
   */
  async checkAgentHealth(): Promise<void> {
    console.log('\n🤖 Step 4: Checking agent health...');

    try {
      const response = await fetch(`${this.baseUrl}/api/test-agents/health`);
      const data = await response.json();

      if (data.success) {
        console.log('✓ All agents are healthy:');
        Object.entries(data.results).forEach(([agent, status]) => {
          const statusText = status === 'ok' ? '✓' : '❌';
          console.log(`  ${statusText} ${agent}: ${status}`);
        });
      } else {
        console.error('❌ Agent health check failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to check agent health:', error);
    }
  }

  /**
   * Run complete end-to-end test
   */
  async run(): Promise<void> {
    console.log('🧪 Starting End-to-End Test\n');
    console.log('═'.repeat(60));

    try {
      // Step 1: Read mock file
      const content = await this.readMockFile();

      // Step 2: Check health first
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        console.error('\n⚠️  Server is not responding. Please ensure:');
        console.error('   1. Server is running (npm run dev)');
        console.error('   2. .env file is configured with credentials');
        console.error('   3. Server is accessible at', this.baseUrl);
        return;
      }

      // Step 3: Check agents
      await this.checkAgentHealth();

      // Step 4: Submit to API
      const result = await this.submitToAPI(content);

      console.log('\n' + '═'.repeat(60));
      console.log('📊 Test Results');
      console.log('═'.repeat(60));

      if (result.success && result.moduleId) {
        console.log('✅ TEST PASSED');
        console.log('\nModule created successfully:');
        console.log(`  • Module ID: ${result.moduleId}`);
        console.log(`  • Message: ${result.message}`);
        console.log('\nNext steps:');
        console.log('  1. Check database for module record');
        console.log('  2. Verify Supabase Storage for uploaded files');
        console.log('  3. Review agent-generated metadata');
        console.log(`\n  Query module: SELECT * FROM modules WHERE id = '${result.moduleId}';`);
      } else {
        console.log('❌ TEST FAILED');
        console.log(`\nError: ${result.error || 'Unknown error'}`);
        console.log(`Message: ${result.message}`);

        if (result.error?.includes('Missing Supabase') ||
            result.error?.includes('SUPABASE')) {
          console.log('\n⚠️  Configuration Issue:');
          console.log('   Please create a .env file with your Supabase credentials.');
          console.log('   Copy .env.example to .env and fill in the values.');
        }
      }

      console.log('\n' + '═'.repeat(60));

    } catch (error) {
      console.error('\n❌ Test failed with exception:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

// Main execution
const test = new E2ETest(
  process.env.TEST_BASE_URL || 'http://localhost:3000',
  process.env.API_KEY
);

test.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
