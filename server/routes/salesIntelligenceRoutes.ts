import express from 'express';
import { callStorage, type CallRecord } from '../callStorage';
import { type ChatMessage } from '../conversationStorage';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Define interfaces for sales intelligence data

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

// In-memory storage for conversation heatmaps
let conversationHeatmaps: ConversationHeatmap[] = [];

// Helper function to load heatmaps from file system or create sample data
const loadHeatmaps = async () => {
  try {
    // Get recent calls
    const calls = await callStorage.getRecentCalls(10);
    
    // If we already have generated heatmaps, use those
    if (conversationHeatmaps.length > 0) {
      return conversationHeatmaps;
    }
    
    // Generate sample heatmaps from calls or create mockups if no calls
    if (calls.length > 0) {
      conversationHeatmaps = await Promise.all(calls.map(generateHeatmapFromCall));
    } else {
      // Return empty array for now - frontend will handle empty state
      conversationHeatmaps = [];
    }
    
    return conversationHeatmaps;
  } catch (error) {
    console.error('Error loading heatmaps:', error);
    return [];
  }
};

// Helper function to generate a heatmap from a call record
const generateHeatmapFromCall = async (call: CallRecord): Promise<ConversationHeatmap> => {
  // Default stages for a sales conversation
  const stageNames = ['introduction', 'discovery', 'presentation', 'handling_objections', 'closing'];
  
  // Calculate total call duration
  const callDuration = call.duration || 300; // Default to 5 minutes if no duration specified
  
  // Generate realistic stage metrics
  const stages: Record<string, StageMetrics> = {};
  
  // Distribute time across stages (more at discovery and handling objections)
  const stageDistribution = {
    introduction: 0.15,
    discovery: 0.30,
    presentation: 0.20,
    handling_objections: 0.25,
    closing: 0.10,
  };
  
  let remainingTime = callDuration;
  
  // Create metrics for each stage
  for (const stage of stageNames) {
    // For the last stage, use all remaining time to ensure total adds up exactly
    const isLastStage = stage === stageNames[stageNames.length - 1];
    const stageDuration = isLastStage ? 
      remainingTime : 
      Math.round(callDuration * stageDistribution[stage as keyof typeof stageDistribution]);
    
    remainingTime -= stageDuration;
    
    // Generate sample sentiment (-1 to 1) with higher values for later stages
    const stageIndex = stageNames.indexOf(stage);
    const baseSentiment = -0.2 + (stageIndex * 0.25);
    const sentiment = Math.min(1, Math.max(-1, baseSentiment + (Math.random() * 0.4 - 0.2)));
    
    // Generate realistic confidence values (0-1)
    const confidence = 0.5 + (Math.random() * 0.4);
    
    // Generate realistic question counts
    const questionCount = stage === 'discovery' ? 
      Math.floor(Math.random() * 5) + 3 : // More questions during discovery
      Math.floor(Math.random() * 3) + 1;  // Fewer questions in other stages
    
    // Generate sample keywords for this stage
    const stageKeywords = getKeywordsForStage(stage);
    const selectedKeywords = stageKeywords
      .sort(() => 0.5 - Math.random()) // Shuffle array
      .slice(0, Math.floor(Math.random() * 3) + 2); // Take 2-4 random keywords
    
    stages[stage] = {
      duration: stageDuration,
      sentiment,
      confidence,
      questionCount,
      keywords: selectedKeywords,
    };
  }
  
  // Calculate overall score (0-100) based on stage metrics
  const overallScore = calculateOverallScore(stages);
  
  return {
    callId: call.id,
    personaId: call.personaId || 'Ella',
    conversationLength: callDuration,
    timestamp: call.timestamp,
    stages,
    overallScore,
  };
};

// Helper function to calculate overall score from stage metrics
const calculateOverallScore = (stages: Record<string, StageMetrics>): number => {
  const stageWeights = {
    introduction: 0.1,
    discovery: 0.25,
    presentation: 0.2,
    handling_objections: 0.25,
    closing: 0.2,
  };
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const [stageName, metrics] of Object.entries(stages)) {
    const weight = stageWeights[stageName as keyof typeof stageWeights] || 0.2;
    totalWeight += weight;
    
    // Score components: sentiment, confidence, and reasonable question count
    const sentimentScore = (metrics.sentiment + 1) * 50; // Convert -1:1 to 0:100
    const confidenceScore = metrics.confidence * 100;
    const questionScore = Math.min(100, metrics.questionCount * 20); // Cap at 100
    
    // Combined stage score
    const stageScore = (sentimentScore * 0.4) + (confidenceScore * 0.4) + (questionScore * 0.2);
    weightedScore += stageScore * weight;
  }
  
  return Math.round(weightedScore / totalWeight);
};

// Helper function to get keywords for a specific stage
const getKeywordsForStage = (stage: string): string[] => {
  const keywordMap: Record<string, string[]> = {
    introduction: ['greeting', 'rapport', 'purpose', 'agenda', 'connection', 'introduction', 'company'],
    discovery: ['needs', 'pain points', 'challenges', 'goals', 'current situation', 'decision process', 'timeline', 'budget', 'requirements'],
    presentation: ['solution', 'features', 'benefits', 'value', 'ROI', 'case study', 'demonstration', 'proof'],
    handling_objections: ['concern', 'hesitation', 'pricing', 'competition', 'implementation', 'timeline', 'resources', 'support'],
    closing: ['next steps', 'agreement', 'contract', 'follow-up', 'decision', 'timeline', 'onboarding', 'commitment'],
  };
  
  return keywordMap[stage] || ['general', 'discussion', 'conversation'];
};

// Generate performance report based on available calls
const generatePerformanceReport = async (): Promise<PerformanceReport> => {
  try {
    // Get all completed calls
    const calls = await callStorage.getCompletedCalls();
    
    // If no calls, return a default report structure
    if (calls.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        conversionRate: 0,
        stageBreakdown: {},
        topPerformingPersonas: [],
      };
    }
    
    // Calculate total calls and average duration
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageDuration = totalDuration / totalCalls;
    
    // Simulate conversion rate based on call data
    // In a real implementation, this would come from actual conversion tracking
    const conversionRate = 0.25 + (Math.random() * 0.15); // 25-40% conversion rate
    
    // Generate stage breakdown
    const stageBreakdown: Record<string, {
      averageDuration: number;
      averageSentiment: number;
      effectiveness: number;
    }> = {
      introduction: {
        averageDuration: 45, // seconds
        averageSentiment: 0.3,
        effectiveness: 78,
      },
      discovery: {
        averageDuration: 120,
        averageSentiment: 0.5,
        effectiveness: 82,
      },
      presentation: {
        averageDuration: 90,
        averageSentiment: 0.7,
        effectiveness: 75,
      },
      handling_objections: {
        averageDuration: 60,
        averageSentiment: 0.2,
        effectiveness: 65,
      },
      closing: {
        averageDuration: 30,
        averageSentiment: 0.8,
        effectiveness: 70,
      },
    };
    
    // Generate top performing personas
    // Group calls by persona
    const personaCalls: Record<string, CallRecord[]> = {};
    calls.forEach(call => {
      const personaId = call.personaId || 'Default';
      if (!personaCalls[personaId]) {
        personaCalls[personaId] = [];
      }
      personaCalls[personaId].push(call);
    });
    
    // Calculate conversion rates for each persona
    const topPerformingPersonas = Object.entries(personaCalls)
      .map(([personaId, personaCalls]) => {
        // Simulate different conversion rates for different personas
        const baseConversionRate = conversionRate;
        const personaConversionRate = baseConversionRate * (0.8 + (Math.random() * 0.4)); // 80-120% of base rate
        
        return {
          personaId,
          conversionRate: personaConversionRate,
          callCount: personaCalls.length,
        };
      })
      .sort((a, b) => b.conversionRate - a.conversionRate);
    
    return {
      totalCalls,
      averageDuration,
      conversionRate,
      stageBreakdown,
      topPerformingPersonas,
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    throw error;
  }
};

// Generate pipeline stage data
const generatePipelineData = async (): Promise<PipelineStageData[]> => {
  // These would typically come from a CRM or sales tracking system
  const pipelineStages: PipelineStageData[] = [
    {
      stageName: 'Lead',
      count: 120,
      conversionRate: 0.8,
      averageDaysInStage: 3.2,
    },
    {
      stageName: 'Qualified',
      count: 95,
      conversionRate: 0.7,
      averageDaysInStage: 5.1,
    },
    {
      stageName: 'Demo',
      count: 65,
      conversionRate: 0.6,
      averageDaysInStage: 4.3,
    },
    {
      stageName: 'Proposal',
      count: 40,
      conversionRate: 0.5,
      averageDaysInStage: 6.2,
    },
    {
      stageName: 'Negotiation',
      count: 18,
      conversionRate: 0.7,
      averageDaysInStage: 7.5,
    },
    {
      stageName: 'Closed',
      count: 12,
      conversionRate: 1.0,
      averageDaysInStage: 2.0,
    },
  ];
  
  return pipelineStages;
};

/**
 * Get all conversation heatmaps
 */
router.get('/heatmaps', async (req, res) => {
  try {
    const heatmaps = await loadHeatmaps();
    res.json(heatmaps);
  } catch (error) {
    console.error('Error fetching heatmaps:', error);
    res.status(500).json({ error: 'Failed to fetch conversation heatmaps' });
  }
});

/**
 * Get a specific conversation heatmap
 */
router.get('/heatmaps/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const heatmaps = await loadHeatmaps();
    const heatmap = heatmaps.find(h => h.callId === callId);
    
    if (!heatmap) {
      return res.status(404).json({ error: 'Heatmap not found' });
    }
    
    res.json(heatmap);
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    res.status(500).json({ error: 'Failed to fetch conversation heatmap' });
  }
});

/**
 * Generate a new heatmap for a call (force regeneration)
 */
router.post('/heatmaps/generate/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await callStorage.getCallById(callId);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const heatmap = await generateHeatmapFromCall(call);
    
    // Update the existing heatmap or add a new one
    const existingIndex = conversationHeatmaps.findIndex(h => h.callId === callId);
    if (existingIndex !== -1) {
      conversationHeatmaps[existingIndex] = heatmap;
    } else {
      conversationHeatmaps.push(heatmap);
    }
    
    res.json(heatmap);
  } catch (error) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({ error: 'Failed to generate conversation heatmap' });
  }
});

/**
 * Get performance report
 */
router.get('/performance', async (req, res) => {
  try {
    const report = await generatePerformanceReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching performance report:', error);
    res.status(500).json({ error: 'Failed to fetch performance report' });
  }
});

/**
 * Get pipeline stage data
 */
router.get('/pipeline', async (req, res) => {
  try {
    const pipelineData = await generatePipelineData();
    res.json(pipelineData);
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline data' });
  }
});

export default router;