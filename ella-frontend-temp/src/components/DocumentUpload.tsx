import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface UploadStatus {
  isUploading: boolean;
  success: boolean;
  message: string;
}

export function DocumentUpload() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    success: false,
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      setUploadStatus({
        isUploading: false,
        success: false,
        message: 'Title and content are required'
      });
      return;
    }
    
    setUploadStatus({
      isUploading: true,
      success: false,
      message: 'Uploading document...'
    });
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          source: source || 'Custom upload',
          category: category || 'General'
        })
      });
      
      const result = await response.json();
      
      if (result && result.success) {
        setUploadStatus({
          isUploading: false,
          success: true,
          message: `${result.message} (${result.chunks} knowledge chunks created)`
        });
        
        // Reset form after successful upload
        setTitle('');
        setContent('');
        setSource('');
        setCategory('');
      } else {
        setUploadStatus({
          isUploading: false,
          success: false,
          message: result?.message || 'Failed to upload document'
        });
      }
    } catch (error) {
      console.error('Document upload error:', error);
      setUploadStatus({
        isUploading: false,
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading document'
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Knowledge Base Upload</CardTitle>
        <CardDescription>
          Add documents to Ella's knowledge base to improve her responses
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Document Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Document Content *
            </Label>
            <Textarea
              id="content"
              placeholder="Enter the document content (text only)"
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-medium">
                Source (Optional)
              </Label>
              <Input
                id="source"
                placeholder="Where does this information come from?"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category (Optional)
              </Label>
              <Input
                id="category"
                placeholder="E.g., Product Info, Technical Documentation"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          
          {uploadStatus.message && (
            <div className={`p-3 rounded flex items-center gap-2 ${
              uploadStatus.isUploading ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
              uploadStatus.success ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {uploadStatus.isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : uploadStatus.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={uploadStatus.isUploading || !title || !content}
          >
            {uploadStatus.isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
        <div>Fields marked with * are required</div>
        <div>Text only - HTML will be stripped</div>
      </CardFooter>
    </Card>
  );
}

export default DocumentUpload;