import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  HelpCircle, 
  Link as LinkIcon, 
  Calendar, 
  Clock, 
  FileText, 
  Download,
  Check,
  Palette,
  Ghost,
  Users,
  Image as ImageIcon,
  MessagesSquare,
  ArrowLeft,
  Copy,
  Loader2
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { usePersona } from '@/hooks/use-persona';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  image?: string;
}

// Sample industry templates
const INDUSTRY_TEMPLATES: TemplateOption[] = [
  {
    id: 'healthcare',
    name: 'Healthcare Assistant',
    description: 'HIPAA-compliant assistant focused on patient scheduling and information management'
  },
  {
    id: 'realestate',
    name: 'Real Estate Agent',
    description: 'Property listings, showings scheduler, and market information specialist'
  },
  {
    id: 'finance',
    name: 'Financial Advisor',
    description: 'Client onboarding, meeting scheduling, and financial guidance assistant'
  },
  {
    id: 'education',
    name: 'Education Helper',
    description: 'Course information, enrollment assistance, and academic scheduling'
  },
  {
    id: 'legal',
    name: 'Legal Assistant',
    description: 'Consultation booking, case management, and legal information provider'
  },
  {
    id: 'custom',
    name: 'Custom Build',
    description: 'Start from scratch and build a completely customized AI assistant'
  }
];

// Default personas to include in export
const DEFAULT_PERSONAS = [
  {
    id: 'executive',
    name: 'Executive Assistant',
    description: 'Formal, efficient, and professional communication style',
    included: true
  },
  {
    id: 'casual',
    name: 'Casual Helper',
    description: 'Friendly, conversational tone with emojis and casual language',
    included: true
  },
  {
    id: 'sales',
    name: 'Sales Representative',
    description: 'Persuasive, solution-oriented with focus on benefits and value',
    included: true
  },
  {
    id: 'technical',
    name: 'Technical Support',
    description: 'Detail-oriented problem solver with technical explanations',
    included: false
  },
  {
    id: 'customer_service',
    name: 'Customer Service',
    description: 'Empathetic, patient, and focused on resolution and satisfaction',
    included: false
  }
];

// Integration options
const INTEGRATION_OPTIONS = [
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Meeting scheduling and calendar integration',
    included: true
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM integration for contact management and tracking',
    included: false
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Financial management and invoicing capabilities',
    included: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and messaging integration',
    included: false
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and meeting setup',
    included: false
  }
];

// Theme options
const THEME_OPTIONS: TemplateOption[] = [
  {
    id: 'default',
    name: 'Professional Blue',
    description: 'Clean, professional design with blue accents'
  },
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Contemporary design with subtle colors and clean lines'
  },
  {
    id: 'vibrant',
    name: 'Vibrant & Energetic',
    description: 'Bold, colorful theme with high-energy design elements'
  },
  {
    id: 'elegant',
    name: 'Elegant Dark',
    description: 'Sophisticated dark theme with gold accents'
  },
  {
    id: 'nature',
    name: 'Natural Green',
    description: 'Calm and organic design with natural green tones'
  }
];

export default function WhiteLabelGenerator() {
  const { toast } = useToast();
  const { personas } = usePersona("");
  
  // Basic information state
  const [companyName, setCompanyName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [industry, setIndustry] = useState('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#f3f4f6');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Personas state
  const [includedPersonas, setIncludedPersonas] = useState(
    DEFAULT_PERSONAS.map(p => ({ ...p }))
  );
  const [customPersona, setCustomPersona] = useState({
    id: 'custom',
    name: '',
    description: '',
    systemPrompt: ''
  });
  
  // Integration state
  const [integrations, setIntegrations] = useState(
    INTEGRATION_OPTIONS.map(i => ({ ...i }))
  );
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [includeImageGeneration, setIncludeImageGeneration] = useState(true);
  
  // Feature toggles
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [themingEnabled, setThemingEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // Export state
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setIndustry(templateId);
    const selected = INDUSTRY_TEMPLATES.find(t => t.id === templateId) || null;
    setSelectedTemplate(selected);
    
    // Pre-populate with template-specific defaults
    if (templateId === 'healthcare') {
      setAssistantName('MedAssist');
      setPrimaryColor('#4cc9f0');
      setSecondaryColor('#f8f9fa');
    } else if (templateId === 'realestate') {
      setAssistantName('PropertyPro');
      setPrimaryColor('#2a9d8f');
      setSecondaryColor('#f8f9fa');
    } else if (templateId === 'finance') {
      setAssistantName('FinanceGPT');
      setPrimaryColor('#023e8a');
      setSecondaryColor('#f8f9fa');
    } else if (templateId === 'education') {
      setAssistantName('EduAssist');
      setPrimaryColor('#8338ec');
      setSecondaryColor('#f8f9fa');
    } else if (templateId === 'legal') {
      setAssistantName('LegalAssist');
      setPrimaryColor('#004b23');
      setSecondaryColor('#f8f9fa');
    }
  };
  
  // Toggle persona inclusion
  const togglePersona = (id: string) => {
    setIncludedPersonas(personas => 
      personas.map(p => 
        p.id === id ? { ...p, included: !p.included } : p
      )
    );
  };
  
  // Toggle integration
  const toggleIntegration = (id: string) => {
    setIntegrations(ints => 
      ints.map(i => 
        i.id === id ? { ...i, included: !i.included } : i
      )
    );
  };
  
  // Generate the export
  const generateExport = () => {
    if (!companyName || !assistantName) {
      toast({
        title: "Missing information",
        description: "Please provide company name and assistant name",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Generate export data structure
    setTimeout(() => {
      const exportObj = {
        version: "1.0.0",
        generated: new Date().toISOString(),
        company: {
          name: companyName,
          logoUrl: logoUrl || null
        },
        assistant: {
          name: assistantName,
          industry: industry
        },
        theme: {
          primaryColor,
          secondaryColor,
          themingEnabled
        },
        personas: includedPersonas.filter(p => p.included),
        customPersona: customPersona.name ? customPersona : null,
        features: {
          voiceEnabled,
          analyticsEnabled,
          imageGeneration: includeImageGeneration
        },
        integrations: integrations.filter(i => i.included).map(i => ({
          type: i.id,
          name: i.name,
          settings: i.id === 'calendly' ? { url: calendlyUrl } : {}
        }))
      };
      
      setExportData(JSON.stringify(exportObj, null, 2));
      setIsGenerating(false);
      
      toast({
        title: "Export Generated",
        description: "Your white-label AI assistant configuration is ready to download",
        variant: "default"
      });
    }, 1500);
  };
  
  // Copy export to clipboard
  const copyToClipboard = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
      toast({
        title: "Copied to clipboard",
        description: "The configuration has been copied to your clipboard",
        variant: "default"
      });
    }
  };
  
  // Download export as JSON file
  const downloadExport = () => {
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.toLowerCase().replace(/\s+/g, '-')}-ai-assistant-config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">YoBot White Label Generator</h1>
          <p className="text-muted-foreground">Create a custom AI assistant for your business or clients</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="basics">Basic Setup</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="export">Generate & Export</TabsTrigger>
        </TabsList>
        
        {/* Basic Setup Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set up your white-labeled AI assistant with basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    placeholder="Acme Corporation" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistantName">AI Assistant Name</Label>
                  <Input 
                    id="assistantName" 
                    placeholder="AcmeGPT" 
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                  <Input 
                    id="logoUrl" 
                    placeholder="https://example.com/logo.png" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL to your company logo. We recommend a square logo with transparent background.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Industry Template</CardTitle>
              <CardDescription>Choose a template to start with or customize from scratch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INDUSTRY_TEMPLATES.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer hover:border-primary transition-colors ${
                      industry === template.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {industry === template.id && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Core Features</CardTitle>
              <CardDescription>Configure which core features to include</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4 text-primary" />
                    <Label htmlFor="voiceEnabled">Voice Capabilities</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable voice input and text-to-speech output
                  </p>
                </div>
                <Switch
                  id="voiceEnabled"
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <Label htmlFor="imageGeneration">Image Generation</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allow users to generate images with DALL·E
                  </p>
                </div>
                <Switch
                  id="imageGeneration"
                  checked={includeImageGeneration}
                  onCheckedChange={setIncludeImageGeneration}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <Label htmlFor="themingEnabled">User Theme Customization</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allow users to customize the interface appearance
                  </p>
                </div>
                <Switch
                  id="themingEnabled"
                  checked={themingEnabled}
                  onCheckedChange={setThemingEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <Label htmlFor="analyticsEnabled">Analytics Dashboard</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include usage analytics and reporting features
                  </p>
                </div>
                <Switch
                  id="analyticsEnabled"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Included Personas</CardTitle>
              <CardDescription>
                Select which pre-defined personas to include with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {includedPersonas.map((persona) => (
                <div key={persona.id} className="flex items-start space-x-3">
                  <Checkbox 
                    id={persona.id} 
                    checked={persona.included}
                    onCheckedChange={() => togglePersona(persona.id)}
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor={persona.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {persona.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {persona.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Persona</CardTitle>
              <CardDescription>Create a custom persona tailored to your business needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customPersonaName">Persona Name</Label>
                <Input 
                  id="customPersonaName" 
                  placeholder="Industry Expert" 
                  value={customPersona.name}
                  onChange={(e) => setCustomPersona({...customPersona, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPersonaDescription">Persona Description</Label>
                <Input 
                  id="customPersonaDescription" 
                  placeholder="Domain-specific expertise with technical language" 
                  value={customPersona.description}
                  onChange={(e) => setCustomPersona({...customPersona, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPersonaPrompt">System Prompt</Label>
                <Textarea 
                  id="customPersonaPrompt" 
                  placeholder="You are an expert in [industry] with deep knowledge of [specific areas]. Respond in a [tone] manner and focus on providing [value proposition]." 
                  value={customPersona.systemPrompt}
                  onChange={(e) => setCustomPersona({...customPersona, systemPrompt: e.target.value})}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Define the behavior, knowledge, and tone of your custom persona
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Select which third-party services to integrate with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-start space-x-3">
                  <Checkbox 
                    id={integration.id} 
                    checked={integration.included}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor={integration.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {integration.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>Configure settings for your enabled integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.find(i => i.id === 'calendly' && i.included) && (
                <div className="space-y-2">
                  <Label htmlFor="calendlyUrl">Calendly URL</Label>
                  <Input 
                    id="calendlyUrl" 
                    placeholder="https://calendly.com/your-account" 
                    value={calendlyUrl}
                    onChange={(e) => setCalendlyUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Calendly booking URL for scheduling appointments
                  </p>
                </div>
              )}
              
              {!integrations.some(i => i.included) && (
                <div className="bg-muted/50 p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No integrations currently enabled. Enable integrations to configure their settings.
                  </p>
                </div>
              )}
              
              {integrations.some(i => i.included && i.id !== 'calendly') && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Additional integration settings will be configured during the implementation phase.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Configuration</CardTitle>
              <CardDescription>Customize the look and feel of your AI assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: primaryColor }}></div>
                    <Input 
                      id="primaryColor" 
                      type="color" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main brand color used for buttons, accents, and highlights
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: secondaryColor }}></div>
                    <Input 
                      id="secondaryColor" 
                      type="color" 
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full h-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Background color used for cards and secondary elements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Theme Templates</CardTitle>
              <CardDescription>Start with a pre-designed theme and customize as needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEME_OPTIONS.map((theme) => (
                  <Card 
                    key={theme.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      switch (theme.id) {
                        case 'default':
                          setPrimaryColor('#3b82f6');
                          setSecondaryColor('#f3f4f6');
                          break;
                        case 'modern':
                          setPrimaryColor('#0ea5e9');
                          setSecondaryColor('#f1f5f9');
                          break;
                        case 'vibrant':
                          setPrimaryColor('#ec4899');
                          setSecondaryColor('#f5f3ff');
                          break;
                        case 'elegant':
                          setPrimaryColor('#fbbf24');
                          setSecondaryColor('#1e293b');
                          break;
                        case 'nature':
                          setPrimaryColor('#10b981');
                          setSecondaryColor('#ecfdf5');
                          break;
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{theme.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                      <div className="flex gap-1">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ 
                            backgroundColor: 
                              theme.id === 'default' ? '#3b82f6' : 
                              theme.id === 'modern' ? '#0ea5e9' : 
                              theme.id === 'vibrant' ? '#ec4899' : 
                              theme.id === 'elegant' ? '#fbbf24' : 
                              '#10b981' 
                          }}
                        ></div>
                        <div 
                          className="h-6 w-12 rounded-md border"
                          style={{ 
                            backgroundColor: 
                              theme.id === 'default' ? '#f3f4f6' : 
                              theme.id === 'modern' ? '#f1f5f9' : 
                              theme.id === 'vibrant' ? '#f5f3ff' : 
                              theme.id === 'elegant' ? '#1e293b' : 
                              '#ecfdf5' 
                          }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>White Label AI Assistant Configuration</CardTitle>
              <CardDescription>Review your configuration and generate your export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Basic Information</h3>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Company:</span>
                        <span className="font-medium">{companyName || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Assistant Name:</span>
                        <span className="font-medium">{assistantName || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Industry:</span>
                        <span className="font-medium">
                          {selectedTemplate?.name || 'Custom'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Features</h3>
                    <div className="bg-muted p-3 rounded-md mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        {voiceEnabled ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ghost className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Voice Capabilities</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {includeImageGeneration ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ghost className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Image Generation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {themingEnabled ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ghost className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Theme Customization</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {analyticsEnabled ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ghost className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Analytics Dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Included Personas</h3>
                    <div className="bg-muted p-3 rounded-md mt-2 flex flex-wrap gap-2">
                      {includedPersonas.filter(p => p.included).map(persona => (
                        <Badge key={persona.id} variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {persona.name}
                        </Badge>
                      ))}
                      {customPersona.name && (
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {customPersona.name}
                        </Badge>
                      )}
                      {includedPersonas.filter(p => p.included).length === 0 && !customPersona.name && (
                        <span className="text-sm text-muted-foreground">No personas selected</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Enabled Integrations</h3>
                    <div className="bg-muted p-3 rounded-md mt-2 flex flex-wrap gap-2">
                      {integrations.filter(i => i.included).map(integration => (
                        <Badge key={integration.id} variant="secondary" className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {integration.name}
                        </Badge>
                      ))}
                      {integrations.filter(i => i.included).length === 0 && (
                        <span className="text-sm text-muted-foreground">No integrations enabled</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Theme</h3>
                    <div className="bg-muted p-3 rounded-md mt-2 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: primaryColor }}></div>
                      <div className="h-6 w-12 rounded-md border" style={{ backgroundColor: secondaryColor }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                size="lg"
                disabled={isGenerating || !companyName || !assistantName}
                onClick={generateExport}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Configuration...
                  </>
                ) : (
                  <>
                    <FileJson className="h-4 w-4" />
                    Generate Your AI Assistant
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {exportData && (
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
                <CardDescription>Your white-label AI assistant configuration is ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-md p-4 max-h-[300px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">{exportData}</pre>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button
                  className="gap-2"
                  onClick={downloadExport}
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}