import React, { useState } from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import AdminPersonaManager from '@/components/AdminPersonaManager';
import ImageGenerator from '@/components/ImageGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { LockKeyhole, ArrowLeft, Image, FileText } from 'lucide-react';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // For demo, default to authenticated
  
  // In a real app, implement proper authentication
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="bg-card border rounded-lg p-8 shadow-md max-w-md w-full">
          <div className="flex flex-col items-center mb-6">
            <LockKeyhole className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-muted-foreground text-center mt-2">
              This area is restricted to YoBot staff members
            </p>
          </div>
          
          {/* In a real application, implement a proper login form */}
          <Button 
            onClick={handleLogin} 
            className="w-full"
          >
            Authenticate (Demo)
          </Button>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-primary hover:underline inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to public site
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">YoBot Admin</h1>
          <p className="text-muted-foreground">Manage Ella's knowledge and system settings</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Public View
          </Button>
        </Link>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="knowledge">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="knowledge" className="mt-6">
          <div className="grid gap-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Knowledge Management</h2>
                <div className="text-sm text-muted-foreground">
                  6 base documents loaded
                </div>
              </div>
              <DocumentUpload />
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-4">Knowledge Base Guidelines</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-muted p-5 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommended Content</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Product specifications and feature details</li>
                    <li>Pricing and tier information</li>
                    <li>Common use cases and examples</li>
                    <li>Frequently asked questions</li>
                    <li>Technical documentation</li>
                  </ul>
                </div>
                <div className="bg-muted p-5 rounded-lg">
                  <h4 className="font-semibold mb-2">Content To Avoid</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Personally identifiable information</li>
                    <li>Confidential business information</li>
                    <li>Unverified or inaccurate information</li>
                    <li>Duplicate content</li>
                    <li>Temporary or soon-to-be-outdated content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Persona Management</h2>
              <AdminPersonaManager />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Image Generation</h2>
              <div className="bg-card border rounded-lg p-6">
                <ImageGenerator />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Voice Settings</h2>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
                <p>Voice configuration settings would appear here.</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">System Parameters</h2>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
                <p>Additional system configuration options would appear here.</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Performance Analytics</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <h3 className="font-medium">Analytics Dashboard</h3>
                  <p className="text-sm mt-2">This would display usage statistics, popular questions, and performance metrics for Ella.</p>
                </div>
                
                <div className="rounded-md bg-blue-50 border border-blue-200 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">Interactive Demo Dashboard</h3>
                    <p className="text-sm text-blue-800 mt-2">Visualize appointments, personas, and images for demos and presentations</p>
                  </div>
                  <div className="mt-4">
                    <Link href="/demo-dashboard">
                      <Button className="w-full flex items-center justify-center gap-2">
                        <Image className="h-4 w-4" />
                        <span>Open Demo Dashboard</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">White Labeling</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md bg-green-50 border border-green-200 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-green-800">White Label Generator</h3>
                    <p className="text-sm text-green-800 mt-2">Create custom AI assistants with your brand, personas, and integrations</p>
                  </div>
                  <div className="mt-4">
                    <Link href="/white-label">
                      <Button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                        <FileText className="h-4 w-4" />
                        <span>Generate Your AI Assistant</span>
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="rounded-md bg-muted p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium">Features</h3>
                    <ul className="text-sm mt-2 space-y-1 list-disc pl-4">
                      <li>Customizable personas and prompts</li>
                      <li>Brand colors and themes</li>
                      <li>Custom DALL·E image styles</li>
                      <li>Integration with third-party services</li>
                      <li>Exportable configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Usage Reports</h2>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
                <p>Detailed usage reports and data exports would be available here in the full version.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}