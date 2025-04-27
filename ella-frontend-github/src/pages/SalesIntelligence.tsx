import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThermometerIcon, BarChart2, PieChart, LineChart as LineChartIcon, Activity, Phone } from 'lucide-react';

// Define the data structures for the Sales Intelligence API
interface StageMetrics {
  duration: number;
  sentiment: number;
  confidence: number;
  questionCount: number;
  keywords: string[];
}

interface ConversationHeatmap {
  callId: string;
  personaId: string;
  conversationLength: number;
  timestamp: string;
  stages: Record<string, StageMetrics>;
  overallScore: number;
}

interface PerformanceReport {
  totalCalls: number;
  averageDuration: number;
  conversionRate: number;
  stageBreakdown: Record<string, {
    averageDuration: number;
    averageSentiment: number;
    effectiveness: number;
  }>;
  topPerformingPersonas: Array<{
    personaId: string;
    conversionRate: number;
    callCount: number;
  }>;
}

interface PipelineStageData {
  stageName: string;
  count: number;
  conversionRate: number;
  averageDaysInStage: number;
}

// Helper function to format dates
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Helper function to format seconds as minutes and seconds
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Helper function to determine the status color based on a score
const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

// Helper function to determine the sentiment label
const getSentimentLabel = (sentiment: number) => {
  if (sentiment > 0.5) return "Very Positive";
  if (sentiment > 0.1) return "Positive";
  if (sentiment > -0.1) return "Neutral";
  if (sentiment > -0.5) return "Negative";
  return "Very Negative";
};

// Helper function to determine the sentiment color
const getSentimentColor = (sentiment: number) => {
  if (sentiment > 0.5) return "bg-green-500";
  if (sentiment > 0.1) return "bg-green-300";
  if (sentiment > -0.1) return "bg-gray-300";
  if (sentiment > -0.5) return "bg-red-300";
  return "bg-red-500";
};

// Component for a single heatmap item
const HeatmapItem: React.FC<{ heatmap: ConversationHeatmap }> = ({ heatmap }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Call with {heatmap.personaId}
          </CardTitle>
          <Badge className={getScoreColor(heatmap.overallScore)}>
            Score: {heatmap.overallScore}
          </Badge>
        </div>
        <CardDescription>
          {formatDate(heatmap.timestamp)} • {formatDuration(heatmap.conversationLength)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="text-sm font-medium mb-1">Conversation Flow</div>
          <div className="flex h-3 rounded-full overflow-hidden">
            {Object.entries(heatmap.stages).map(([stageName, metrics], index) => {
              const width = (metrics.duration / heatmap.conversationLength) * 100;
              const sentimentColor = getSentimentColor(metrics.sentiment);
              return (
                <div
                  key={stageName}
                  className={`${sentimentColor} h-full`}
                  style={{ width: `${width}%` }}
                  title={`${stageName}: ${formatDuration(metrics.duration)}`}
                />
              );
            })}
          </div>
        </div>

        {expanded && (
          <>
            <div className="mt-4 space-y-4">
              <div className="text-sm font-medium">Stage Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(heatmap.stages).map(([stageName, metrics]) => (
                  <div key={stageName} className="border rounded-md p-3">
                    <div className="font-medium capitalize">{stageName}</div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {formatDuration(metrics.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sentiment: {getSentimentLabel(metrics.sentiment)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Confidence: {Math.round(metrics.confidence * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Questions: {metrics.questionCount}
                    </div>
                    <div className="mt-2">
                      {metrics.keywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className="mr-1 mb-1">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show Less" : "Show Details"}
        </Button>
        <Link to={`/calls/${heatmap.callId}`}>
          <Button variant="outline" className="ml-2">
            View Full Call
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Main Sales Intelligence Component
const SalesIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState('heatmaps');

  // Fetch heatmaps
  const { data: heatmapsData, isLoading: heatmapsLoading, isError: heatmapsError } = useQuery({
    queryKey: ['/api/sales-intel/heatmaps'],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
  
  // Safely access heatmaps data
  const heatmaps = Array.isArray(heatmapsData) ? heatmapsData : [];

  // Fetch performance report
  const { data: performanceReport, isLoading: reportLoading, isError: reportError } = useQuery({
    queryKey: ['/api/sales-intel/performance'],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch pipeline data
  const { data: pipelineData, isLoading: pipelineLoading, isError: pipelineError } = useQuery({
    queryKey: ['/api/sales-intel/pipeline'],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Prepare stage breakdown data for chart
  const getStageChartData = () => {
    if (!performanceReport || !performanceReport.stageBreakdown) return [];
    
    return Object.entries(performanceReport.stageBreakdown).map(([stage, data]) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      duration: Math.round(data.averageDuration / 60), // Convert to minutes
      sentiment: Math.round(data.averageSentiment * 100), // Scale to 0-100
      effectiveness: Math.round(data.effectiveness)
    }));
  };

  // Prepare pipeline data for chart
  const getPipelineChartData = () => {
    if (!pipelineData) return [];
    
    return pipelineData.map(stage => ({
      name: stage.stageName,
      count: stage.count,
      conversion: Math.round(stage.conversionRate * 100),
      days: stage.averageDaysInStage
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sales Intelligence</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-6">
          <TabsTrigger value="heatmaps" className="flex items-center">
            <ThermometerIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Conversation Heatmaps</span>
            <span className="sm:hidden">Heatmaps</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center">
            <LineChartIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Pipeline Analysis</span>
            <span className="sm:hidden">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center">
            <Phone className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Recent Calls</span>
            <span className="sm:hidden">Calls</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmaps">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Conversation Heatmaps</h2>
            <p className="text-muted-foreground mb-4">
              Visualize how conversations flow through different stages and identify patterns in customer interactions.
            </p>
            
            {heatmapsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : heatmaps && heatmaps.length > 0 ? (
              <div className="space-y-4">
                {heatmaps.map((heatmap: ConversationHeatmap) => (
                  <HeatmapItem key={heatmap.callId} heatmap={heatmap} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <ThermometerIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No conversation heatmaps available yet.</p>
                  <p className="text-muted-foreground mb-4">Make some calls to generate heatmaps.</p>
                  <Link to="/ai-caller">
                    <Button>Start a Call</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
            <p className="text-muted-foreground mb-4">
              Track conversation performance metrics across personas and stages.
            </p>
            
            {reportLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : performanceReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Total Calls</div>
                        <div className="text-3xl font-bold">{performanceReport.totalCalls}</div>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Average Duration</div>
                        <div className="text-3xl font-bold">{formatDuration(performanceReport.averageDuration)}</div>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
                        <div className="text-3xl font-bold">{Math.round(performanceReport.conversionRate * 100)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Stage Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getStageChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="duration" name="Avg. Duration (min)" fill="#8884d8" />
                          <Bar dataKey="effectiveness" name="Effectiveness (%)" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Top Performing Personas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Persona</th>
                            <th className="text-left py-2 px-4">Call Count</th>
                            <th className="text-left py-2 px-4">Conversion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceReport.topPerformingPersonas.map(persona => (
                            <tr key={persona.personaId} className="border-b">
                              <td className="py-2 px-4 font-medium">{persona.personaId}</td>
                              <td className="py-2 px-4">{persona.callCount}</td>
                              <td className="py-2 px-4">
                                <Badge className={getScoreColor(persona.conversionRate * 100)}>
                                  {Math.round(persona.conversionRate * 100)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No performance data available yet.</p>
                  <p className="text-muted-foreground mb-4">Make some calls to generate performance metrics.</p>
                  <Link to="/ai-caller">
                    <Button>Start a Call</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Pipeline Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Track how leads move through your sales pipeline and identify bottlenecks.
            </p>
            
            {pipelineLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : pipelineData ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Stage Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getPipelineChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="count" name="Lead Count" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line yAxisId="right" type="monotone" dataKey="conversion" name="Conversion %" stroke="#82ca9d" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Detail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Stage</th>
                            <th className="text-left py-2 px-4">Count</th>
                            <th className="text-left py-2 px-4">Conversion Rate</th>
                            <th className="text-left py-2 px-4">Avg. Days in Stage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineData.map(stage => (
                            <tr key={stage.stageName} className="border-b">
                              <td className="py-2 px-4 font-medium">{stage.stageName}</td>
                              <td className="py-2 px-4">{stage.count}</td>
                              <td className="py-2 px-4">
                                <Badge className={getScoreColor(stage.conversionRate * 100)}>
                                  {Math.round(stage.conversionRate * 100)}%
                                </Badge>
                              </td>
                              <td className="py-2 px-4">{stage.averageDaysInStage.toFixed(1)} days</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pipeline data available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
            <p className="text-muted-foreground mb-4">
              View and analyze your most recent sales calls.
            </p>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>
                  Your most recent calls and their performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">This feature is coming soon</p>
                  <p className="text-muted-foreground mb-4">Check back for updates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesIntelligence;