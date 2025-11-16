import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AgentResults, CreateModuleResponse } from '@/lib/api';

interface ResultsPanelProps {
  testResults?: AgentResults;
  createResults?: CreateModuleResponse;
}

export function ResultsPanel({ testResults, createResults }: ResultsPanelProps) {
  if (!testResults && !createResults) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Submit a markdown file to see processing results here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-center">
            No results yet. Upload and process a markdown file to see the agent outputs.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle create module results
  if (createResults) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Module Created</CardTitle>
          <CardDescription>
            The module has been saved to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {createResults.success ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {createResults.message}
                {createResults.moduleId && (
                  <div className="mt-2">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      ID: {createResults.moduleId}
                    </span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {createResults.error || createResults.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Handle test results
  const results = testResults!.results;
  const validation = results?.validation;

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              AI agent analysis complete
            </CardDescription>
          </div>
          {testResults.processingTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(testResults.processingTime / 1000).toFixed(2)}s
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Score */}
        {validation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quality Score</span>
              <span className="text-2xl font-bold">
                {validation.qualityScore}/100
              </span>
            </div>
            <Progress value={validation.qualityScore} max={100} />
            {validation.isValid ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Validation Passed
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                {validation.issuesCount} Issue{validation.issuesCount !== 1 ? 's' : ''} Found
              </div>
            )}
          </div>
        )}

        {/* Validation Issues */}
        {validation && validation.issues && validation.issues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Validation Issues</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validation.issues.map((issue, i) => (
                  <li key={i} className="text-xs">{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Agent Results Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {results?.summary && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Short Summary</h3>
                  <p className="text-sm text-muted-foreground">{results.summary.short}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Medium Summary</h3>
                  <p className="text-sm text-muted-foreground">{results.summary.medium}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Long Summary</h3>
                  <p className="text-sm text-muted-foreground">{results.summary.long}</p>
                </div>
                <div>
                  <Badge variant="outline">
                    Markdown Length: {results.summary.markdownLength} chars
                  </Badge>
                </div>
              </>
            )}
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            {results?.seo && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Meta Title</h3>
                  <p className="text-sm text-muted-foreground">{results.seo.metaTitle}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Meta Description</h3>
                  <p className="text-sm text-muted-foreground">{results.seo.metaDescription}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {results.seo.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4">
            {results?.category && (
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <div className="space-y-2">
                  <Badge>{results.category.category}</Badge>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(results.category.confidence * 100).toFixed(1)}%
                  </p>
                  {results.category.alternates && results.category.alternates.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Alternates:</p>
                      <div className="flex flex-wrap gap-1">
                        {results.category.alternates.map((alt, i) => (
                          <Badge key={i} variant="outline">
                            {alt.category} ({(alt.confidence * 100).toFixed(0)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {results?.tags && (
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {results.tags.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                {results.tags.relatedTopics && results.tags.relatedTopics.length > 0 && (
                  <>
                    <h3 className="font-medium mb-2">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.tags.relatedTopics.map((topic, i) => (
                        <Badge key={i} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {results?.imagePrompt && (
              <div>
                <h3 className="font-medium mb-2">Image Generation Prompt</h3>
                <p className="text-sm text-muted-foreground mb-2">{results.imagePrompt.prompt}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">Style: {results.imagePrompt.style}</Badge>
                  {results.imagePrompt.colors.map((color, i) => (
                    <Badge key={i} variant="outline">{color}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-4">
            {results?.schema && (
              <div>
                <h3 className="font-medium mb-2">Schema.org Types</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {results.schema.types.map((type, i) => (
                    <Badge key={i} variant="secondary">{type}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  JSON-LD Size: {results.schema.jsonSize} bytes
                </p>
              </div>
            )}
            {results?.embeddings && (
              <div>
                <h3 className="font-medium mb-2">Vector Embeddings</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    Dimensions: {results.embeddings.dimensions}
                  </p>
                  <p className="text-muted-foreground">
                    Model: {results.embeddings.model}
                  </p>
                </div>
              </div>
            )}
            {validation && (
              <div>
                <h3 className="font-medium mb-2">Validation Report</h3>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {validation.report}
                  </pre>
                </div>
                {validation.suggestions && validation.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-xs text-muted-foreground">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
