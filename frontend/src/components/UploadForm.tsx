import { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient, type AgentResults, type CreateModuleResponse } from '@/lib/api';

interface UploadFormProps {
  onTestResults: (results: AgentResults) => void;
  onCreateResults: (results: CreateModuleResponse) => void;
}

export function UploadForm({ onTestResults, onCreateResults }: UploadFormProps) {
  const [mode, setMode] = useState<'test' | 'save'>('test');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.md')) {
      setError('Please select a markdown (.md) file');
      return;
    }

    try {
      const text = await file.text();
      setContent(text);

      // Extract title from first H1 if not set
      if (!title) {
        const h1Match = text.match(/^#\s+(.+)$/m);
        if (h1Match) {
          setTitle(h1Match[1]);
        }
      }

      setError('');
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please provide markdown content');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'test') {
        const results = await apiClient.testAgents({
          title: title || 'Untitled',
          content,
        });
        onTestResults(results);
      } else {
        const results = await apiClient.createModule({
          title: title || undefined,
          content,
          autoSync: false,
        });
        onCreateResults(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setContent('');
    setTitle('');
    setError('');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Markdown</CardTitle>
            <CardDescription>
              Upload a .md file or paste markdown content
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={mode === 'test' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setMode('test')}
            >
              Test Only
            </Badge>
            <Badge
              variant={mode === 'save' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setMode('save')}
            >
              Save to DB
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop a markdown file here, or
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or paste markdown</span>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Title (optional)
            </label>
            <Input
              placeholder="Module title (auto-extracted if empty)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Markdown Content
            </label>
            <Textarea
              placeholder="# Your Markdown Here&#10;&#10;Paste your markdown content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              className="min-h-[300px] font-mono text-xs"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : mode === 'test' ? (
                'Test Agents'
              ) : (
                'Create Module'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
