import React from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import { Separator } from '@/components/ui/separator';

export default function KnowledgeBase() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Ella's Knowledge Base</h1>
        <p className="text-lg text-center text-muted-foreground max-w-3xl">
          Customize what Ella knows by adding documents to her knowledge base. 
          This helps her provide more accurate and relevant responses to questions about your specific topics.
        </p>
      </div>
      
      <Separator className="my-8" />
      
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-10">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upload Document</h2>
            <p className="text-muted-foreground mb-6">
              Add new knowledge to Ella's database by uploading text documents. 
              The content will be processed, indexed, and made available for Ella to use in conversations.
            </p>
            <DocumentUpload />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg p-6 border shadow-sm">
                <div className="font-bold text-xl mb-2">1. Upload</div>
                <p className="text-muted-foreground">
                  Add documents with information you want Ella to know and reference in conversations.
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-6 border shadow-sm">
                <div className="font-bold text-xl mb-2">2. Process</div>
                <p className="text-muted-foreground">
                  Ella intelligently processes and indexes the information for efficient retrieval.
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-6 border shadow-sm">
                <div className="font-bold text-xl mb-2">3. Respond</div>
                <p className="text-muted-foreground">
                  Ask Ella questions related to the uploaded content, and she'll provide relevant answers.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Break large documents into focused, topic-specific uploads for better results</li>
              <li>Include relevant keywords and specific terminology in your documents</li>
              <li>Use clear, concise language for optimal processing</li>
              <li>Categorize your uploads to help with organization</li>
              <li>Include source information to track where the knowledge comes from</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}