// API client for interacting with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TestAgentsRequest {
  title: string;
  content: string;
}

export interface CreateModuleRequest {
  title?: string;
  content: string;
  autoSync?: boolean;
}

export interface AgentResults {
  success: boolean;
  processingTime?: number;
  results?: {
    summary?: {
      short: string;
      medium: string;
      long: string;
      markdownLength: number;
    };
    seo?: {
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
    };
    category?: {
      category: string;
      confidence: number;
      alternates: Array<{ category: string; confidence: number }>;
    };
    tags?: {
      tags: string[];
      relatedTopics: string[];
    };
    schema?: {
      types: string[];
      jsonSize: number;
    };
    imagePrompt?: {
      prompt: string;
      style: string;
      colors: string[];
    };
    embeddings?: {
      dimensions: number;
      model: string;
    };
    validation?: {
      isValid: boolean;
      qualityScore: number;
      issuesCount: number;
      issues: string[];
      suggestions: string[];
      report: string;
    };
  };
  error?: string;
  message?: string;
}

export interface CreateModuleResponse {
  success: boolean;
  message?: string;
  moduleId?: string;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async testAgents(data: TestAgentsRequest): Promise<AgentResults> {
    const response = await fetch(`${this.baseUrl}/api/test-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createModule(data: CreateModuleRequest): Promise<CreateModuleResponse> {
    const response = await fetch(`${this.baseUrl}/api/modules/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
