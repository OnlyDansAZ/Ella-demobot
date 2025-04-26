import { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, CheckCircle, Clock, FileText, MessageSquare, Plus, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

// Types for follow-up intelligence
interface FollowupIntel {
  id: string;
  eventId: string;
  eventTitle: string;
  meetingDate: string;
  keySummaryPoints: string[];
  participantFeedback?: {
    rating?: number;
    feedback?: string;
    timestamp?: string;
  };
  nextStepsRecommended: string[];
  nextStepsTaken: string[];
  statusUpdatesSent: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FollowupIntel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [match, params] = useRoute('/followup/:id');
  const [newStep, setNewStep] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [newStatusUpdate, setNewStatusUpdate] = useState('');
  
  // Get all followup records
  const { data: allRecords, isLoading: isLoadingAll } = useQuery<{ success: boolean, records: FollowupIntel[] }>({
    queryKey: ['/api/followup'],
    enabled: !params?.id,
  });
  
  // Get specific followup record
  const { data: recordData, isLoading: isLoadingRecord } = useQuery<{ success: boolean, record: FollowupIntel }>({
    queryKey: ['/api/followup', params?.id],
    enabled: !!params?.id,
  });
  
  // Get report for a specific followup
  const { data: reportData, isLoading: isLoadingReport } = useQuery<{ success: boolean, report: string }>({
    queryKey: ['/api/followup', params?.id, 'report'],
    enabled: !!params?.id,
  });
  
  // Add next step mutation
  const addNextStepMutation = useMutation({
    mutationFn: async ({ id, step }: { id: string, step: string }) => {
      return apiRequest('POST', `/api/followup/${id}/nextstep`, { step });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id, 'report'] });
      setNewStep('');
      toast({
        title: 'Success',
        description: 'Next step added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add next step: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Add feedback mutation
  const addFeedbackMutation = useMutation({
    mutationFn: async ({ id, rating, feedback }: { id: string, rating: number, feedback?: string }) => {
      return apiRequest('POST', `/api/followup/${id}/feedback`, { rating, feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id, 'report'] });
      setFeedbackText('');
      toast({
        title: 'Success',
        description: 'Feedback added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add feedback: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Add status update mutation
  const addStatusUpdateMutation = useMutation({
    mutationFn: async ({ id, update }: { id: string, update: string }) => {
      return apiRequest('POST', `/api/followup/${id}/statusupdate`, { update });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/followup', params?.id, 'report'] });
      setNewStatusUpdate('');
      toast({
        title: 'Success',
        description: 'Status update added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add status update: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Process recent events mutation
  const processRecentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/followup/process-recent');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followup'] });
      toast({
        title: 'Success',
        description: 'Recently completed events processed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to process recent events: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleAddNextStep = () => {
    if (!newStep.trim() || !params?.id) return;
    
    addNextStepMutation.mutate({
      id: params.id,
      step: newStep,
    });
  };
  
  const handleAddFeedback = () => {
    if (!params?.id) return;
    
    addFeedbackMutation.mutate({
      id: params.id,
      rating: feedbackRating,
      feedback: feedbackText.trim() || undefined,
    });
  };
  
  const handleAddStatusUpdate = () => {
    if (!newStatusUpdate.trim() || !params?.id) return;
    
    addStatusUpdateMutation.mutate({
      id: params.id,
      update: newStatusUpdate,
    });
  };
  
  const intel: FollowupIntel | undefined = recordData?.record;
  const report = reportData?.report;
  const records = allRecords?.records || [];
  
  // Calculate progress percentage
  const getProgress = (intel?: FollowupIntel) => {
    if (!intel) return 0;
    const total = intel.nextStepsRecommended.length;
    const completed = intel.nextStepsTaken.length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMMM d, yyyy h:mm a');
  };
  
  if (params?.id) {
    // Display a specific follow-up intel record
    return (
      <div className="container mx-auto py-6">
        <div className="mb-4">
          <Button variant="outline" asChild>
            <Link href="/followup">← Back to All Records</Link>
          </Button>
        </div>
        
        {isLoadingRecord ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : !intel ? (
          <Card>
            <CardHeader>
              <CardTitle>Record Not Found</CardTitle>
              <CardDescription>The follow-up record you're looking for doesn't exist.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{intel.eventTitle}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <CalendarIcon className="w-4 h-4 mr-1" /> 
                      {formatDate(intel.meetingDate)}
                    </CardDescription>
                  </div>
                  <Badge variant={getProgress(intel) === 100 ? "success" : "secondary"}>
                    {getProgress(intel)}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="nextSteps">Next Steps</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    <TabsTrigger value="report">Full Report</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="summary">
                    <h3 className="text-lg font-semibold mb-2">Key Meeting Points</h3>
                    <ul className="space-y-2 mb-4">
                      {intel.keySummaryPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <h3 className="text-lg font-semibold mt-4 mb-2">Progress</h3>
                    <Progress value={getProgress(intel)} className="h-2 mb-2" />
                    <div className="text-sm text-muted-foreground">
                      {intel.nextStepsTaken.length} of {intel.nextStepsRecommended.length} next steps completed
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="nextSteps">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Recommended Next Steps</h3>
                        <ul className="space-y-2">
                          {intel.nextStepsRecommended.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-5 h-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Steps Taken</h3>
                        {intel.nextStepsTaken.length === 0 ? (
                          <p className="text-muted-foreground">No steps have been taken yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {intel.nextStepsTaken.map((step, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-2">Add New Completed Step</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter completed step..."
                            value={newStep}
                            onChange={(e) => setNewStep(e.target.value)}
                            className="flex-grow"
                          />
                          <Button 
                            onClick={handleAddNextStep}
                            disabled={!newStep.trim() || addNextStepMutation.isPending}
                          >
                            {addNextStepMutation.isPending ? 'Adding...' : 'Add Step'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="feedback">
                    <div className="space-y-4">
                      {intel.participantFeedback ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Participant Feedback</h3>
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center mb-2">
                              <span className="font-medium mr-2">Rating:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < (intel.participantFeedback?.rating || 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {intel.participantFeedback.feedback && (
                              <div>
                                <span className="font-medium">Comments:</span>
                                <p className="mt-1">{intel.participantFeedback.feedback}</p>
                              </div>
                            )}
                            
                            {intel.participantFeedback.timestamp && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Submitted on {formatDate(intel.participantFeedback.timestamp)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Add Participant Feedback</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium mb-2">Rating</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-6 h-6 cursor-pointer ${
                                      i < feedbackRating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                    onClick={() => setFeedbackRating(i + 1)}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium mb-2">Comments (Optional)</div>
                              <Textarea
                                placeholder="Share your thoughts about the meeting..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                rows={4}
                              />
                            </div>
                            
                            <Button
                              onClick={handleAddFeedback}
                              disabled={addFeedbackMutation.isPending}
                            >
                              {addFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Status Updates Sent</h3>
                        {intel.statusUpdatesSent.length === 0 ? (
                          <p className="text-muted-foreground">No status updates have been sent yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {intel.statusUpdatesSent.map((update, index) => (
                              <li key={index} className="flex items-start">
                                <MessageSquare className="w-5 h-5 mr-2 text-blue-500 shrink-0 mt-0.5" />
                                <span>{update}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        <div className="pt-4">
                          <h3 className="text-lg font-semibold mb-2">Add Status Update</h3>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter status update..."
                              value={newStatusUpdate}
                              onChange={(e) => setNewStatusUpdate(e.target.value)}
                              className="flex-grow"
                            />
                            <Button
                              onClick={handleAddStatusUpdate}
                              disabled={!newStatusUpdate.trim() || addStatusUpdateMutation.isPending}
                            >
                              {addStatusUpdateMutation.isPending ? 'Adding...' : 'Add Update'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="report">
                    {isLoadingReport ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap bg-secondary p-4 rounded-lg">
                          {report || 'No report available'}
                        </pre>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Last updated: {formatDate(intel.updatedAt)}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    );
  }
  
  // List view of all follow-up records
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow-up Intelligence</h1>
          <p className="text-muted-foreground">Track meeting outcomes and next steps</p>
        </div>
        <Button 
          onClick={() => processRecentMutation.mutate()}
          disabled={processRecentMutation.isPending}
        >
          <Clock className="w-4 h-4 mr-2" />
          {processRecentMutation.isPending ? 'Processing...' : 'Process Recent Meetings'}
        </Button>
      </div>
      
      {isLoadingAll ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Follow-up Records</CardTitle>
            <CardDescription>There are no follow-up intelligence records available yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Follow-up intelligence is generated automatically after meetings or can be manually created from calendar events.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record: FollowupIntel) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{record.eventTitle}</CardTitle>
                  <Badge variant="outline">{getProgress(record)}%</Badge>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <CalendarIcon className="w-4 h-4 mr-1" /> 
                  {formatDate(record.meetingDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Key Points</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {record.keySummaryPoints.slice(0, 2).map((point, index) => (
                      <li key={index} className="line-clamp-1">{point}</li>
                    ))}
                    {record.keySummaryPoints.length > 2 && (
                      <li className="text-sm text-muted-foreground">+{record.keySummaryPoints.length - 2} more points</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Next Steps</div>
                  <Progress value={getProgress(record)} className="h-2 mb-2" />
                  <div className="text-xs text-muted-foreground">
                    {record.nextStepsTaken.length} of {record.nextStepsRecommended.length} completed
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/followup/${record.id}`}>
                    <FileText className="w-4 h-4 mr-2" /> View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}