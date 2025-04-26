import fs from 'fs-extra';
import path from 'path';
import { callStorage } from './callStorage';

// Define the interfaces for Sales Intelligence data
export interface StageMetrics {
  duration: number;
  sentiment: number;
  confidence: number;
  questionCount: number;
  keywords: string[];
}

export interface ConversationHeatmap {
  callId: string;
  personaId: string;
  conversationLength: number;
  timestamp: string;
  stages: Record<string, StageMetrics>;
  overallScore: number;
}

export interface PerformanceReport {
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

export interface PipelineStageData {
  stageName: string;
  count: number;
  conversionRate: number;
  averageDaysInStage: number;
}

/**
 * Service for managing sales intelligence data, including conversation heatmaps,
 * performance reports, and pipeline analysis.
 */
class SalesIntelligenceService {
  private heatmaps: ConversationHeatmap[] = [];
  private heatmapsFilePath: string = path.join(process.cwd(), 'data', 'conversation_heatmaps.json');
  
  constructor() {
    this.initializeFolder();
    this.loadHeatmapsFromFile();
  }
  
  /**
   * Initialize the folder structure
   */
  private initializeFolder() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  /**
   * Load heatmaps from file
   */
  private loadHeatmapsFromFile() {
    try {
      if (fs.existsSync(this.heatmapsFilePath)) {
        const data = fs.readFileSync(this.heatmapsFilePath, 'utf8');
        this.heatmaps = JSON.parse(data);
        console.log(`Loaded ${this.heatmaps.length} conversation heatmaps from file`);
      } else {
        console.log('No conversation heatmaps file found, creating a new one');
        this.saveHeatmapsToFile();
      }
    } catch (error) {
      console.error('Error loading conversation heatmaps:', error);
      this.heatmaps = [];
    }
  }
  
  /**
   * Save heatmaps to file
   */
  private saveHeatmapsToFile() {
    try {
      fs.writeFileSync(this.heatmapsFilePath, JSON.stringify(this.heatmaps, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving conversation heatmaps:', error);
    }
  }
  
  /**
   * Get all heatmaps
   */
  async getAllHeatmaps(): Promise<ConversationHeatmap[]> {
    if (this.heatmaps.length === 0) {
      // Generate heatmaps from calls if none exist
      await this.generateHeatmapsFromCalls();
    }
    return this.heatmaps;
  }
  
  /**
   * Get a heatmap by call ID
   */
  async getHeatmapByCallId(callId: string): Promise<ConversationHeatmap | undefined> {
    return this.heatmaps.find(heatmap => heatmap.callId === callId);
  }
  
  /**
   * Generate heatmaps from existing calls
   */
  async generateHeatmapsFromCalls(): Promise<ConversationHeatmap[]> {
    try {
      // Get completed calls
      const calls = await callStorage.getCompletedCalls();
      
      if (calls.length === 0) {
        return [];
      }
      
      // Generate a heatmap for each call
      for (const call of calls) {
        // Check if a heatmap already exists for this call
        const existingHeatmapIndex = this.heatmaps.findIndex(h => h.callId === call.id);
        
        if (existingHeatmapIndex === -1) {
          // No existing heatmap, generate a new one
          const heatmap = await this.generateHeatmapFromCall(call);
          this.heatmaps.push(heatmap);
        }
      }
      
      // Save the updated heatmaps
      this.saveHeatmapsToFile();
      
      return this.heatmaps;
    } catch (error) {
      console.error('Error generating heatmaps from calls:', error);
      return this.heatmaps;
    }
  }
  
  /**
   * Generate a heatmap for a specific call
   */
  async generateHeatmapForCall(callId: string): Promise<ConversationHeatmap | undefined> {
    try {
      const call = await callStorage.getCallById(callId);
      
      if (!call) {
        return undefined;
      }
      
      // Generate the heatmap
      const heatmap = await this.generateHeatmapFromCall(call);
      
      // Update or add the heatmap
      const existingIndex = this.heatmaps.findIndex(h => h.callId === callId);
      if (existingIndex !== -1) {
        this.heatmaps[existingIndex] = heatmap;
      } else {
        this.heatmaps.push(heatmap);
      }
      
      // Save the updated heatmaps
      this.saveHeatmapsToFile();
      
      return heatmap;
    } catch (error) {
      console.error('Error generating heatmap for call:', error);
      return undefined;
    }
  }
  
  /**
   * Helper function to generate a heatmap from a call record
   */
  private async generateHeatmapFromCall(call: any): Promise<ConversationHeatmap> {
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
      
      // Generate keywords for this stage
      const stageKeywords = this.getKeywordsForStage(stage);
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
    const overallScore = this.calculateOverallScore(stages);
    
    return {
      callId: call.id,
      personaId: call.personaId || 'Ella',
      conversationLength: callDuration,
      timestamp: call.timestamp,
      stages,
      overallScore,
    };
  }
  
  /**
   * Helper function to calculate overall score from stage metrics
   */
  private calculateOverallScore(stages: Record<string, StageMetrics>): number {
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
  }
  
  /**
   * Helper function to get keywords for a specific stage
   */
  private getKeywordsForStage(stage: string): string[] {
    const keywordMap: Record<string, string[]> = {
      introduction: ['greeting', 'rapport', 'purpose', 'agenda', 'connection', 'introduction', 'company'],
      discovery: ['needs', 'pain points', 'challenges', 'goals', 'current situation', 'decision process', 'timeline', 'budget', 'requirements'],
      presentation: ['solution', 'features', 'benefits', 'value', 'ROI', 'case study', 'demonstration', 'proof'],
      handling_objections: ['concern', 'hesitation', 'pricing', 'competition', 'implementation', 'timeline', 'resources', 'support'],
      closing: ['next steps', 'agreement', 'contract', 'follow-up', 'decision', 'timeline', 'onboarding', 'commitment'],
    };
    
    return keywordMap[stage] || ['general', 'discussion', 'conversation'];
  }
  
  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
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
      const personaCalls: Record<string, any[]> = {};
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
  }
  
  /**
   * Generate pipeline stage data
   */
  async generatePipelineData(): Promise<PipelineStageData[]> {
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
  }
}

export const salesIntelligenceService = new SalesIntelligenceService();