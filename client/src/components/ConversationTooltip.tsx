import React, { useEffect, useState } from 'react';
import { 
  X, Copy, Check, Mail, Brain, ArrowLeft, History, Lightbulb, 
  Target, Sparkles, Link, Star, Pencil, BookOpen, FileText,
  FileJson, Download, ClipboardCopy, FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConversationTooltipProps {
  stage: string;
  analysisMode: string;
  visible: boolean;
  confidence?: number;
  memoryMode?: string;
  onClose: () => void;
}

interface SavedTip {
  id: string;
  stage: string;
  mode: string;
  text: string;
  timestamp: string;
}

interface ExportData {
  title: string;
  stage: string;
  analysisMode: string;
  content: string;
  notes?: string;
  confidence?: number;
  memoryMode?: string;
  savedTips?: SavedTip[];
  timestamp: string;
}

export function ConversationTooltip(props: ConversationTooltipProps) {
  const { stage, analysisMode, visible, confidence = 0.85, memoryMode = 'persistent', onClose } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(analysisMode === 'strategic' ? 'strategy' : 'tactical');
  const [customTip, setCustomTip] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [pinnedTips, setPinnedTips] = useState<SavedTip[]>([]);
  const [savedHistory, setSavedHistory] = useState<SavedTip[]>([]);
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const { toast } = useToast();
  
  // Handle animation for smooth entrance/exit
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsCopied(false); // Reset copy state when tooltip appears
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  // Function to get plain text content from the tooltip
  const getPlainTextContent = () => {
    let title = getStageName(stage) + " - " + (analysisMode === 'strategic' ? 'Strategic Approach' : 'Tactical Approach');
    let content = getTooltipText(stage, analysisMode);
    return `${title}\n\n${content}`;
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    const text = getPlainTextContent();
    navigator.clipboard.writeText(text)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Guidance tips have been copied to your clipboard",
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  // Helper function for copying current tab's content
  const copyActiveTabContent = () => {
    let textToCopy = '';
    
    switch (activeTab) {
      case 'strategy':
        textToCopy = getTooltipText(stage, 'strategic');
        break;
      case 'tactical':
        textToCopy = getTooltipText(stage, 'tactical');
        break;
      case 'psychology':
        // For psychology tab, format the text differently
        const title = `Sales Psychology: ${getStageName(stage)} - ${analysisMode === 'strategic' ? 'Strategic' : 'Tactical'} Approach`;
        const content = getTooltipText(stage, analysisMode);
        textToCopy = `${title}\n\n${content}`;
        break;
      case 'notes':
        textToCopy = personalNotes;
        break;
      case 'history':
        // Format saved history as a list
        textToCopy = 'Saved Sales Tips:\n\n' + 
          savedHistory.map(tip => 
            `${tip.stage} (${tip.mode}): ${tip.text}`
          ).join('\n\n');
        break;
      default:
        textToCopy = getTooltipText(stage, analysisMode);
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content copied to clipboard`,
        });
        
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  // Function to pin/save current tip
  const saveTip = () => {
    const newTip: SavedTip = {
      id: `${Date.now()}`,
      stage,
      mode: analysisMode,
      text: isEditing && customTip ? customTip : getTooltipText(stage, analysisMode),
      timestamp: new Date().toISOString()
    };
    
    // Add to pinned tips
    setPinnedTips([...pinnedTips, newTip]);
    
    // Also add to history
    setSavedHistory([...savedHistory, newTip]);
    
    toast({
      title: "Tip saved",
      description: "This tip has been pinned to your saved collection",
    });
  };
  
  // Function to generate a shareable link
  const generateShareableLink = () => {
    // Create a base64 encoded version of the tip
    const tipData = {
      stage,
      mode: analysisMode,
      text: isEditing && customTip ? customTip : getTooltipText(stage, analysisMode)
    };
    
    const encodedData = btoa(JSON.stringify(tipData));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?tip=${encodedData}`;
    
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Shareable link has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy link",
          description: "Could not copy shareable link. Please try again.",
          variant: "destructive"
        });
      });
  };

  // Prepare export data in different formats
  const prepareExportData = (): ExportData => {
    return {
      title: `Sales Guidance: ${getStageName(stage)} - ${analysisMode === 'strategic' ? 'Strategic' : 'Tactical'} Approach`,
      stage,
      analysisMode,
      content: getTooltipText(stage, analysisMode),
      notes: personalNotes || undefined,
      confidence,
      memoryMode,
      savedTips: pinnedTips.length > 0 ? pinnedTips : undefined,
      timestamp: new Date().toISOString()
    };
  };

  // Export as formatted text/clipboard
  const exportAsText = () => {
    const data = prepareExportData();
    let text = `# ${data.title}\n\n`;
    text += `Date: ${new Date(data.timestamp).toLocaleString()}\n`;
    text += `Conversation Stage: ${getStageName(data.stage)}\n`;
    text += `Analysis Mode: ${data.analysisMode === 'strategic' ? 'Strategic' : 'Tactical'}\n`;
    text += `Confidence Score: ${Math.round((data.confidence || 0) * 100)}%\n\n`;
    text += `## Guidance\n\n${data.content}\n\n`;
    
    if (data.savedTips && data.savedTips.length > 0) {
      text += `## Saved Tips\n\n`;
      data.savedTips.forEach(tip => {
        text += `- ${getStageName(tip.stage)} (${tip.mode === 'strategic' ? 'Strategic' : 'Tactical'}):\n  ${tip.text.split('\n').join('\n  ')}\n\n`;
      });
    }

    if (data.notes) {
      text += `## Personal Notes\n\n${data.notes}\n\n`;
    }

    text += `## Psychology Insights\n\n`;
    const psychologyText = getPsychologyExplanation(data.stage, data.analysisMode)?.props?.children
      .map((child: any) => {
        if (typeof child === 'string') return child;
        if (child?.type === 'p') return child.props.children.flat().join('');
        if (child?.type === 'ul') {
          return child.props.children.map((li: any) => `- ${li.props.children}`).join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
    
    text += psychologyText || "No psychology insights available.";
    text += `\n\n---\nExported from YoBot Conversation Engine`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Text Report Copied",
      description: "Detailed report has been copied to your clipboard",
    });
    
    return text;
  };

  // Export as JSON
  const exportAsJson = () => {
    const data = prepareExportData();
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create and download the file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-guidance-${data.stage}-${data.analysisMode}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Exported",
      description: "Data exported as JSON file for analysis",
    });
    
    return jsonString;
  };

  // Export as CSV
  const exportAsCsv = () => {
    const data = prepareExportData();
    
    // Create header row
    let csv = "Title,Stage,Mode,Content,Notes,Confidence,MemoryMode,Timestamp\n";
    
    // Create data row (escape commas and quotes in content)
    const escapeCsvField = (field: string) => {
      if (!field) return '';
      return `"${field.replace(/"/g, '""')}"`;
    };
    
    csv += [
      escapeCsvField(data.title),
      escapeCsvField(getStageName(data.stage)),
      escapeCsvField(data.analysisMode),
      escapeCsvField(data.content),
      escapeCsvField(data.notes || ''),
      data.confidence ? (data.confidence * 100).toFixed(2) : '',
      escapeCsvField(data.memoryMode || ''),
      escapeCsvField(data.timestamp)
    ].join(',') + '\n';
    
    // Add saved tips as additional rows if available
    if (data.savedTips && data.savedTips.length > 0) {
      csv += "\nSaved Tips\nStage,Mode,Content,Timestamp\n";
      data.savedTips.forEach(tip => {
        csv += [
          escapeCsvField(getStageName(tip.stage)),
          escapeCsvField(tip.mode),
          escapeCsvField(tip.text),
          escapeCsvField(tip.timestamp)
        ].join(',') + '\n';
      });
    }
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-guidance-${data.stage}-${data.analysisMode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Exported",
      description: "Data exported as CSV file for spreadsheet use",
    });
    
    return csv;
  };

  // Export as PDF (using browser's print to PDF functionality)
  const exportAsPdf = () => {
    const data = prepareExportData();
    
    // Create a temporary iframe with styled content to print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${data.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .logo {
              font-size: 18px;
              font-weight: bold;
              color: #1a56db;
              margin-bottom: 5px;
            }
            h1 {
              font-size: 22px;
              margin: 10px 0;
              color: #1a56db;
            }
            .meta {
              font-size: 14px;
              color: #666;
              margin: 10px 0;
            }
            .meta-item {
              margin: 5px 0;
              display: flex;
              justify-content: space-between;
            }
            .meta-label {
              font-weight: bold;
              color: #666;
            }
            .section {
              margin: 25px 0;
            }
            h2 {
              font-size: 18px;
              margin: 15px 0 10px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
              color: #1a56db;
            }
            ul {
              padding-left: 20px;
              margin: 10px 0;
            }
            li {
              margin: 5px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            .confidence {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              color: white;
              font-weight: bold;
              background-color: #1a56db;
            }
            .saved-tip {
              padding: 10px;
              margin: 10px 0;
              background-color: #f9fafb;
              border-left: 3px solid #1a56db;
              border-radius: 3px;
            }
            .note-box {
              padding: 15px;
              background-color: #fffde7;
              border-radius: 4px;
              margin: 10px 0;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
                font-size: 12px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">YoBot™ Conversation Engine</div>
            <h1>${data.title}</h1>
            <div class="meta">
              <div class="meta-item">
                <span class="meta-label">Date:</span>
                <span>${new Date(data.timestamp).toLocaleString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Conversation Stage:</span>
                <span>${getStageName(data.stage)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Analysis Mode:</span>
                <span>${data.analysisMode === 'strategic' ? 'Strategic' : 'Tactical'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Confidence Score:</span>
                <span class="confidence">${Math.round((data.confidence || 0) * 100)}%</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Memory Mode:</span>
                <span>${data.memoryMode === 'persistent' ? 'Persistent Memory' : 'Stateless Memory'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Guidance</h2>
            <div>${data.content.replace(/\n/g, '<br>').replace(/•\s/g, '• ')}</div>
          </div>

          ${data.savedTips && data.savedTips.length > 0 ? `
          <div class="section">
            <h2>Saved Tips</h2>
            ${data.savedTips.map(tip => `
              <div class="saved-tip">
                <strong>${getStageName(tip.stage)} (${tip.mode === 'strategic' ? 'Strategic' : 'Tactical'})</strong>
                <p>${tip.text.replace(/\n/g, '<br>')}</p>
                <small>Saved: ${new Date(tip.timestamp).toLocaleString()}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${data.notes ? `
          <div class="section">
            <h2>Personal Notes</h2>
            <div class="note-box">${data.notes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}

          <div class="section">
            <h2>Psychology Insights</h2>
            <div>${getPsychologyExplanation(data.stage, data.analysisMode)?.props?.children
              .map((child: any) => {
                if (typeof child === 'string') return child;
                if (child?.type === 'p') return `<p>${child.props.children.flat().join('')}</p>`;
                if (child?.type === 'ul') {
                  return `<ul>${child.props.children.map((li: any) => `<li>${li.props.children}</li>`).join('')}</ul>`;
                }
                return '';
              })
              .filter(Boolean)
              .join('') || "No psychology insights available."}
            </div>
          </div>

          <div class="footer">
            <p>Exported from YoBot™ Conversation Engine on ${new Date().toLocaleString()}</p>
            <p>© ${new Date().getFullYear()} YoBot, Inc. All rights reserved.</p>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Wait for resources to load
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
          
          toast({
            title: "PDF Export",
            description: "Use the browser's print dialog to save as PDF",
          });
        } catch (e) {
          console.error('Print error:', e);
          document.body.removeChild(iframe);
          toast({
            title: "Export Failed",
            description: "Could not generate PDF. Try another format.",
            variant: "destructive"
          });
        }
      }, 500);
    }
  };

  if (!isVisible) return null;
  
  return (
    <>
      <div className="tooltip-backdrop" onClick={onClose}></div>
      
      <div 
        className={`fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          max-w-md w-full bg-white rounded-lg shadow-xl border border-primary/10 p-5
          tooltip-entrance transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Header with context information */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
              Conversation Guidance
              {confidence > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                  {Math.round(confidence * 100)}% match
                </span>
              )}
            </h3>
            <div className="text-xs text-muted-foreground flex gap-2 mt-1">
              <span className="px-1.5 py-0.5 bg-slate-100 rounded-full">{getStageName(stage)}</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded-full">{memoryMode === 'persistent' ? 'Persistent Memory' : 'Stateless'}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {/* Tab interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full conversation-tooltip-tabs">
          <TabsList className="w-full mb-4 grid grid-cols-5">
            <TabsTrigger value="strategy" className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              <span>Strategy</span>
            </TabsTrigger>
            <TabsTrigger value="tactical" className="flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Tactical</span>
            </TabsTrigger>
            <TabsTrigger value="psychology" className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              <span>Psychology</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-3.5 w-3.5" />
              <span>Saved</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" />
              <span>Notes</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Strategic tab content */}
          <TabsContent value="strategy" className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-md">
              {getTooltipContent(stage, 'strategic')}
            </div>
            
            {/* Edit/customize button */}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary hover:text-primary/80 group w-full justify-center border border-dashed border-primary/20 hover:border-primary/40 py-2"
                onClick={() => {
                  setCustomTip(getTooltipText(stage, 'strategic'));
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                <span>Customize this tip</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <textarea 
                  className="w-full p-3 rounded-md border border-input min-h-[100px]" 
                  value={customTip} 
                  onChange={(e) => setCustomTip(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Tactical tab content */}
          <TabsContent value="tactical" className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-md">
              {getTooltipContent(stage, 'tactical')}
            </div>
            
            {/* Edit/customize button */}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary hover:text-primary/80 group w-full justify-center border border-dashed border-primary/20 hover:border-primary/40 py-2"
                onClick={() => {
                  setCustomTip(getTooltipText(stage, 'tactical'));
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                <span>Customize this tip</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <textarea 
                  className="w-full p-3 rounded-md border border-input min-h-[100px]" 
                  value={customTip} 
                  onChange={(e) => setCustomTip(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Psychology tab content */}
          <TabsContent value="psychology" className="space-y-4">
            <div className="text-sm text-slate-700 space-y-4 p-3 bg-primary/5 rounded-md">
              {getPsychologyExplanation(stage, analysisMode)}
            </div>
          </TabsContent>
          
          {/* History tab content */}
          <TabsContent value="history" className="space-y-4">
            {pinnedTips.length > 0 ? (
              <div className="space-y-3">
                {pinnedTips.map(tip => (
                  <div key={tip.id} className="p-3 border rounded-md text-sm flex flex-col">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{getStageName(tip.stage)} ({tip.mode === 'strategic' ? 'Strategic' : 'Tactical'})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setPinnedTips(pinnedTips.filter(t => t.id !== tip.id));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-slate-600 mb-2">{tip.text}</p>
                    <div className="text-xs text-slate-400 mt-auto">
                      Saved {new Date(tip.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>You haven't saved any tips yet.</p>
                <p className="text-sm mt-1">Click the star icon to save tips for later reference.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Notes tab content */}
          <TabsContent value="notes" className="space-y-4">
            <textarea
              className="w-full p-3 border rounded-md min-h-[200px]"
              placeholder="Add your personal notes here..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              onClick={() => {
                // Auto-save is implemented through the state change above
                toast({
                  title: "Notes saved",
                  description: "Your notes have been saved"
                });
              }}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save notes</span>
            </Button>
          </TabsContent>
        </Tabs>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-1.5 text-muted-foreground group"
            onClick={saveTip}
          >
            <Star className="h-3.5 w-3.5 group-hover:text-yellow-500 transition-all group-active:animate-[star-pulse_0.5s]" />
            <span>Pin tip</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-1.5 text-muted-foreground group"
            onClick={generateShareableLink}
          >
            <Link className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
            <span>Share link</span>
          </Button>
          
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground group"
              >
                <FileDown className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 export-dropdown-menu">
              <DropdownMenuLabel className="font-semibold text-center bg-primary-50/20 py-2">
                Export War Room Report
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start" onClick={exportAsPdf}>
                <div className="flex items-center w-full">
                  <FileText className="h-4 w-4 mr-2 text-primary export-icon" />
                  <span className="export-label">Professional PDF</span>
                </div>
                <span className="export-description ml-6">Clean, print-ready document for clients/investors</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start" onClick={exportAsText}>
                <div className="flex items-center w-full">
                  <ClipboardCopy className="h-4 w-4 mr-2 text-primary export-icon" />
                  <span className="export-label">Markdown to Clipboard</span>
                </div>
                <span className="export-description ml-6">Instant paste into docs, CRMs, Slack</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start" onClick={exportAsCsv}>
                <div className="flex items-center w-full">
                  <Download className="h-4 w-4 mr-2 text-primary export-icon" />
                  <span className="export-label">Export as CSV</span>
                </div>
                <span className="export-description ml-6">Spreadsheet-ready format for analysis</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex flex-col items-start" onClick={exportAsJson}>
                <div className="flex items-center w-full">
                  <FileJson className="h-4 w-4 mr-2 text-primary export-icon" />
                  <span className="export-label">Export as JSON</span>
                </div>
                <span className="export-description ml-6">For developers and automation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <span className="flex-1"></span>
          
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5"
            onClick={copyActiveTabContent}
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}

// Helper functions
function getStageName(stage: string): string {
  switch(stage) {
    case 'introduction': return 'Introduction';
    case 'discovery': return 'Discovery';
    case 'presentation': return 'Presentation';
    case 'objection': return 'Objection Handling';
    case 'closing': return 'Closing';
    default: return 'Conversation Guidance';
  }
}

// Convert tooltip content to plain text
function getTooltipText(stage: string, analysisMode: string): string {
  // Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return `Focus on building rapport and establishing credibility. Ask questions to understand the prospect's broader business context and goals rather than immediate pain points.

Key tips:
• Introduce yourself and your company briefly, then focus on the prospect
• Ask about their strategic priorities and vision
• Listen more, speak less - gather information to personalize later stages`;
  }
  
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return `Get to the point quickly and establish relevance. Demonstrate you understand their industry and specific challenges to capture interest.

Key tips:
• Lead with a specific, relevant insight about their industry
• Reference similar clients you've helped with specific results
• Quickly transition to qualifying questions to assess fit`;
  }
  
  // Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return `Explore broader business goals and long-term challenges. Understand the decision-making process and stakeholders involved.

Key tips:
• Ask about organizational challenges and strategic initiatives
• Understand their current solution landscape and gaps
• Explore decision criteria and buying process`;
  }
  
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return `Focus on immediate pain points and specific challenges that your solution can address directly. Gather concrete details about current processes.

Key tips:
• Ask about specific pain points with measurable impact
• Quantify costs of inaction or current inefficiencies
• Get detailed information about current workflows`;
  }
  
  // Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return `Focus on long-term value and organizational impact. Connect your solution to the prospect's strategic goals and broader business outcomes.

Key tips:
• Demonstrate understanding of their strategic vision
• Present solution in terms of achieving long-term objectives
• Include case studies with strategic impact metrics`;
  }
  
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return `Emphasize immediate solutions to specific problems. Focus on features and capabilities that directly address the pain points identified.

Key tips:
• Highlight specific features that solve identified problems
• Present direct ROI calculations and short-term gains
• Offer a practical implementation timeline`;
  }
  
  // Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return `Address objections by connecting back to long-term vision and competitive advantage. Focus on strategic risk mitigation and organizational alignment.

Key tips:
• Acknowledge concerns as valid considerations
• Reframe objections in the context of long-term goals
• Present adoption as a strategic advantage over competitors`;
  }
  
  if (stage === 'objection' && analysisMode === 'tactical') {
    return `Address objections with specific counterpoints and evidence. Provide concrete examples and data to overcome concerns directly.

Key tips:
• Offer specific evidence and data to counter objections
• Provide concrete examples of overcoming similar concerns
• Suggest practical solutions or accommodations`;
  }
  
  // Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return `Focus on partnership and long-term relationship. Present the decision as an investment in future success and competitive advantage.

Key tips:
• Summarize alignment with strategic objectives
• Present implementation as a partnership journey
• Suggest a phased approach with long-term roadmap`;
  }
  
  if (stage === 'closing' && analysisMode === 'tactical') {
    return `Be direct about next steps and create urgency. Focus on immediate benefits and quick wins from making a decision now.

Key tips:
• Present a clear, specific next action
• Create urgency with time-limited incentives
• Focus on quick implementation and immediate results`;
  }
  
  // Default
  return `Adapt your approach based on the current conversation stage and your strategic goals. Use the stage indicators and analysis mode toggles to guide your conversation flow.`;
}

// Psychology explanations for each approach
function getPsychologyExplanation(stage: string, analysisMode: string) {
  // Strategic Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> The strategic introduction leverages the <em>primacy effect</em> by 
          focusing first on building trust rather than pitching. This creates psychological safety that leads 
          to more openness. 
        </p>
        <p>
          When you focus on the prospect's broader business context, you tap into their need to be understood 
          at a deeper level than just as a sales target. Senior executives respond well to this approach because 
          it mirrors how they think—holistically and strategically.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Reciprocity - When you show genuine interest in their goals, they're more likely to reciprocate with interest in your solution</li>
          <li>Authority positioning - Demonstrating strategic understanding positions you as a peer rather than just a vendor</li>
          <li>Active listening demonstrates emotional intelligence, which builds rapport more effectively than talking</li>
        </ul>
      </>
    );
  }
  
  // Tactical Introduction
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> The tactical introduction leverages the <em>cognitive ease principle</em>—people 
          prefer information that's easy to process. By quickly establishing relevance and showing industry knowledge, 
          you reduce the mental effort needed to evaluate whether the conversation is worth continuing.
        </p>
        <p>
          This approach works particularly well with busy decision-makers and technical evaluators who appreciate 
          efficiency and evidence. It shows respect for their time and creates immediate credibility.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Pattern recognition - Industry-specific insights trigger recognition that you understand their world</li>
          <li>Social proof - Referencing similar clients taps into the power of "others like me" thinking</li>
          <li>Selective attention - People pay more attention when they hear information directly relevant to their situation</li>
        </ul>
      </>
    );
  }
  
  // Strategic Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic discovery taps into the <em>status principle</em> by focusing 
          on higher-level business concerns that executives and decision-makers care about, showing you understand 
          their organizational perspective and priorities.
        </p>
        <p>
          By exploring decision-making processes and stakeholders, you're mapping the psychology of the buying 
          committee, which allows you to identify champions, blockers, and influencers. This creates a psychological 
          advantage when planning your approach.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Confirmation bias - When you ask about strategic initiatives, people naturally connect your solution to those priorities</li>
          <li>Endowment effect - Understanding existing solutions helps you position yours not as a replacement but as an enhancement of their prior investments</li>
          <li>Group dynamics - Uncovering the decision process helps you navigate the social psychology of organizational buying</li>
        </ul>
      </>
    );
  }
  
  // Tactical Discovery
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical discovery leverages the <em>loss aversion principle</em>—the 
          psychological tendency for people to feel losses more strongly than equivalent gains. By focusing on 
          specific pain points and quantifying costs of inaction, you create urgency.
        </p>
        <p>
          This approach works particularly well with practical problem-solvers and those who need to justify purchase 
          decisions to others. It provides concrete evidence they can use in internal discussions.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Pain focus - The brain pays more attention to solving problems than seeking opportunities</li>
          <li>Concrete thinking - Specific details about workflows create clearer mental pictures than abstract concepts</li>
          <li>Quantification effect - Putting numbers to problems makes them seem more real and actionable</li>
        </ul>
      </>
    );
  }
  
  // Strategic Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic presentation uses the <em>construal level theory</em>—when 
          people think about the future, they focus on abstract benefits rather than concrete features. By 
          connecting to long-term goals, you tap into this psychological distance.
        </p>
        <p>
          This approach resonates with visionary leaders and those who make decisions based on strategic fit rather than 
          just specifications. It aligns your solution with their aspirational self-image.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Vision alignment - People are more motivated by a compelling vision than by tactical benefits</li>
          <li>Strategic validation - Case studies with impact metrics provide evidence that supports their strategic thinking</li>
          <li>Identity appeal - Framing your solution as part of their strategic identity ("forward-thinking companies like yours") creates deeper resonance</li>
        </ul>
      </>
    );
  }
  
  // Tactical Presentation
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical presentation leverages the <em>specificity principle</em>—concrete, 
          specific claims are psychologically more persuasive than generalized benefits. By focusing on features that 
          solve identified problems, you create clear cause-effect connections.
        </p>
        <p>
          This approach appeals to analytical thinkers and practical implementers who need to understand exactly how 
          something works. It reduces perceived risk by showing a clear path to results.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Feature-benefit linking - Directly connecting features to specific problems creates stronger mental associations</li>
          <li>ROI focus - Concrete calculations tap into the rational decision-making system</li>
          <li>Implementation clarity - Specific timelines reduce uncertainty, which lowers psychological resistance</li>
        </ul>
      </>
    );
  }
  
  // Strategic Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic objection handling uses <em>reframing techniques</em> to shift 
          perception from immediate concerns to long-term advantages. This cognitive restructuring helps prospects 
          see objections as less significant within the bigger picture.
        </p>
        <p>
          By connecting back to their vision, you're activating their aspirational thinking which can override 
          immediate objections. This works especially well for strategic decision-makers.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Validation before reframing - Acknowledging concerns as valid satisfies the need to be heard and understood</li>
          <li>Goal hierarchy - Connecting to higher-level goals puts smaller concerns in perspective</li>
          <li>Competitive psychology - Framing adoption as a strategic advantage triggers fear of missing out (FOMO)</li>
        </ul>
      </>
    );
  }
  
  // Tactical Objection Handling
  if (stage === 'objection' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical objection handling leverages the <em>evidence principle</em>—specific, 
          concrete evidence is more persuasive than general reassurances. By providing data and examples, you reduce 
          the cognitive dissonance that objections create.
        </p>
        <p>
          This approach works well with skeptical prospects and those who need factual validation. It satisfies their 
          need for certainty and proof before moving forward.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Confirmation through specificity - Precise data points are psychologically more convincing than general statements</li>
          <li>Counterexample effect - Specific examples of overcoming similar concerns create mental models of success</li>
          <li>Problem-solution pairing - Directly addressing specific concerns with specific solutions creates cognitive closure</li>
        </ul>
      </>
    );
  }
  
  // Strategic Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic closing uses the <em>commitment and consistency principle</em>—people 
          tend to act in ways that align with their previous statements and values. By summarizing alignment with their 
          strategic objectives, you remind them of the congruence between their goals and your solution.
        </p>
        <p>
          Framing implementation as a partnership activates the psychology of relationship rather than transaction, which 
          is particularly effective with long-term thinkers and relationship-oriented buyers.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Future pacing - Visualizing successful implementation triggers anticipation of positive outcomes</li>
          <li>Alignment reinforcement - Reminding them of how the solution connects to their stated objectives strengthens commitment</li>
          <li>Reduced risk perception - A phased approach with a roadmap decreases the psychological magnitude of the decision</li>
        </ul>
      </>
    );
  }
  
  // Tactical Closing
  if (stage === 'closing' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical closing leverages the <em>scarcity principle</em> and <em>action bias</em>—people 
          value things more when they might miss out, and they prefer clear, specific actions over ambiguity.
        </p>
        <p>
          This approach works particularly well with decisive prospects and those motivated by immediate results. It reduces 
          decision paralysis by providing a clear, concrete next step.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Clarity reduces resistance - A specific next action eliminates confusion about how to proceed</li>
          <li>Time-limited incentives create urgency through loss aversion (fear of missing out)</li>
          <li>Immediate gratification - Emphasizing quick implementation appeals to the psychological desire for fast results</li>
        </ul>
      </>
    );
  }
  
  // Default
  return (
    <p>
      Select a specific conversation stage and analysis mode to see detailed psychological insights behind these sales strategies.
    </p>
  );
}

function getTooltipContent(stage: string, analysisMode: string) {
  // Strategic Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Introduction</h4>
        <p className="text-sm text-slate-700">
          Focus on building rapport and establishing credibility. Ask questions to understand 
          the prospect's broader business context and goals rather than immediate pain points.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Introduce yourself and your company briefly, then focus on the prospect</li>
          <li>Ask about their strategic priorities and vision</li>
          <li>Listen more, speak less - gather information to personalize later stages</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Introduction
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Introduction</h4>
        <p className="text-sm text-slate-700">
          Get to the point quickly and establish relevance. Demonstrate you understand 
          their industry and specific challenges to capture interest.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Lead with a specific, relevant insight about their industry</li>
          <li>Reference similar clients you've helped with specific results</li>
          <li>Quickly transition to qualifying questions to assess fit</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Discovery</h4>
        <p className="text-sm text-slate-700">
          Explore broader business goals and long-term challenges. Understand the 
          decision-making process and stakeholders involved.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Ask about organizational challenges and strategic initiatives</li>
          <li>Understand their current solution landscape and gaps</li>
          <li>Explore decision criteria and buying process</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Discovery
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Discovery</h4>
        <p className="text-sm text-slate-700">
          Focus on immediate pain points and specific challenges that your solution can address directly.
          Gather concrete details about current processes.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Ask about specific pain points with measurable impact</li>
          <li>Quantify costs of inaction or current inefficiencies</li>
          <li>Get detailed information about current workflows</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Presentation</h4>
        <p className="text-sm text-slate-700">
          Focus on long-term value and organizational impact. Connect your solution 
          to the prospect's strategic goals and broader business outcomes.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Demonstrate understanding of their strategic vision</li>
          <li>Present solution in terms of achieving long-term objectives</li>
          <li>Include case studies with strategic impact metrics</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Presentation
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Presentation</h4>
        <p className="text-sm text-slate-700">
          Emphasize immediate solutions to specific problems. Focus on features 
          and capabilities that directly address the pain points identified.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Highlight specific features that solve identified problems</li>
          <li>Present direct ROI calculations and short-term gains</li>
          <li>Offer a practical implementation timeline</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Objection Handling</h4>
        <p className="text-sm text-slate-700">
          Address objections by connecting back to long-term vision and competitive advantage. 
          Focus on strategic risk mitigation and organizational alignment.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Acknowledge concerns as valid considerations</li>
          <li>Reframe objections in the context of long-term goals</li>
          <li>Present adoption as a strategic advantage over competitors</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Objection Handling
  if (stage === 'objection' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Objection Handling</h4>
        <p className="text-sm text-slate-700">
          Address objections with specific counterpoints and evidence. Provide 
          concrete examples and data to overcome concerns directly.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Offer specific evidence and data to counter objections</li>
          <li>Provide concrete examples of overcoming similar concerns</li>
          <li>Suggest practical solutions or accommodations</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Closing</h4>
        <p className="text-sm text-slate-700">
          Focus on partnership and long-term relationship. Present the decision 
          as an investment in future success and competitive advantage.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Summarize alignment with strategic objectives</li>
          <li>Present implementation as a partnership journey</li>
          <li>Suggest a phased approach with long-term roadmap</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Closing
  if (stage === 'closing' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Closing</h4>
        <p className="text-sm text-slate-700">
          Be direct about next steps and create urgency. Focus on immediate 
          benefits and quick wins from making a decision now.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Present a clear, specific next action</li>
          <li>Create urgency with time-limited incentives</li>
          <li>Focus on quick implementation and immediate results</li>
        </ul>
      </div>
    );
  }
  
  // Default message
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-slate-900">Sales Conversation Tips</h4>
      <p className="text-sm text-slate-700">
        Adapt your approach based on the current conversation stage and your strategic goals.
        Use the stage indicators and analysis mode toggles to guide your conversation flow.
      </p>
    </div>
  );
}