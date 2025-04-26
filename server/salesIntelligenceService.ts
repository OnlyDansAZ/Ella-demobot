import path from 'path';
import fs from 'fs';
import { CallRecord } from '../shared/schema';

/**
 * Stage definitions for sales conversations
 */
export const CONVERSATION_STAGES = {
  INTRODUCTION: 'introduction',
  DISCOVERY: 'discovery',
  QUALIFICATION: 'qualification',
  OBJECTION_HANDLING: 'objection_handling',
  PRESENTATION: 'presentation',
  CLOSE: 'close',
  FOLLOWUP: 'followup'
};

/**
 * Metrics tracked for each conversation stage
 */
export interface StageMetrics {
  duration: number;  // seconds spent in this stage
  sentiment: number; // -1 to 1 sentiment score
  confidence: number; // 0 to 1 confidence score
  questionCount: number; // number of questions asked
  keywords: string[]; // key phrases detected
}

/**
 * Conversation heatmap data structure
 */
export interface ConversationHeatmap {
  callId: string;
  personaId: string;
  conversationLength: number; // total seconds
  timestamp: string;
  stages: Record<string, StageMetrics>;
  overallScore: number; // 0-100 conversation effectiveness score
}

/**
 * Performance aggregates across calls
 */
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

/**
 * Pipeline stage data
 */
export interface PipelineStageData {
  stageName: string;
  count: number;
  conversionRate: number;
  averageDaysInStage: number;
}

/**
 * Service for generating sales intelligence and analytics
 */
export class SalesIntelligenceService {
  private heatmaps: Map<string, ConversationHeatmap> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'conversation_heatmaps.json');
  
  constructor() {
    this.initializeFolder();
    this.loadFromFile();
  }
  
  /**
   * Initialize folder structure
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
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const heatmaps = JSON.parse(data);
        this.heatmaps = new Map(Object.entries(heatmaps));
        console.log(`Loaded ${this.heatmaps.size} conversation heatmaps from file`);
      } else {
        console.log('No conversation heatmaps file found, creating a new one');
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading conversation heatmaps:', error);
      this.heatmaps = new Map();
    }
  }
  
  /**
   * Save heatmaps to file
   */
  private saveToFile() {
    try {
      const heatmapsObject = Object.fromEntries(this.heatmaps);
      fs.writeFileSync(this.filePath, JSON.stringify(heatmapsObject, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving conversation heatmaps:', error);
    }
  }
  
  /**
   * Generate a conversation heatmap for a call record
   */
  async generateHeatmap(callRecord: CallRecord): Promise<ConversationHeatmap> {
    // Skip if we already have a heatmap for this call
    if (this.heatmaps.has(callRecord.id)) {
      return this.heatmaps.get(callRecord.id)!;
    }
    
    // Parse transcript to identify conversation stages
    const stageAnalysis = await this.analyzeConversationStages(callRecord);
    
    // Calculate overall effectiveness score
    const overallScore = this.calculateOverallScore(stageAnalysis);
    
    // Create heatmap
    const heatmap: ConversationHeatmap = {
      callId: callRecord.id,
      personaId: callRecord.personaId || 'unknown',
      conversationLength: this.calculateConversationLength(callRecord),
      timestamp: callRecord.timestamp,
      stages: stageAnalysis,
      overallScore
    };
    
    // Save heatmap
    this.heatmaps.set(callRecord.id, heatmap);
    this.saveToFile();
    
    return heatmap;
  }
  
  /**
   * Analyze conversation stages from a call record
   */
  private async analyzeConversationStages(callRecord: CallRecord): Promise<Record<string, StageMetrics>> {
    // This would normally use NLP to analyze the transcript and identify stages
    // For now, we'll create a simple simulation based on the transcript length and timestamps
    
    const stages: Record<string, StageMetrics> = {};
    const transcript = callRecord.transcript || [];
    
    if (transcript.length === 0) {
      return stages;
    }
    
    // Simple stage detection based on conversation progress
    const totalMessages = transcript.length;
    const introEnd = Math.floor(totalMessages * 0.15);
    const discoveryEnd = Math.floor(totalMessages * 0.4);
    const qualificationEnd = Math.floor(totalMessages * 0.6);
    const objectionEnd = Math.floor(totalMessages * 0.75);
    const presentationEnd = Math.floor(totalMessages * 0.9);
    
    // Sample metrics for each stage (in a real implementation, these would be derived from actual analysis)
    stages[CONVERSATION_STAGES.INTRODUCTION] = this.calculateStageMetrics(transcript.slice(0, introEnd));
    stages[CONVERSATION_STAGES.DISCOVERY] = this.calculateStageMetrics(transcript.slice(introEnd, discoveryEnd));
    stages[CONVERSATION_STAGES.QUALIFICATION] = this.calculateStageMetrics(transcript.slice(discoveryEnd, qualificationEnd));
    stages[CONVERSATION_STAGES.OBJECTION_HANDLING] = this.calculateStageMetrics(transcript.slice(qualificationEnd, objectionEnd));
    stages[CONVERSATION_STAGES.PRESENTATION] = this.calculateStageMetrics(transcript.slice(objectionEnd, presentationEnd));
    stages[CONVERSATION_STAGES.CLOSE] = this.calculateStageMetrics(transcript.slice(presentationEnd));
    
    return stages;
  }
  
  /**
   * Calculate metrics for a specific conversation stage
   */
  private calculateStageMetrics(messages: any[]): StageMetrics {
    if (messages.length === 0) {
      return {
        duration: 0,
        sentiment: 0,
        confidence: 0,
        questionCount: 0,
        keywords: []
      };
    }
    
    // In a real implementation, this would use NLP to analyze the messages
    // For now, we'll generate plausible simulated data
    const avgMessageLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length;
    const questionCount = messages.filter(m => m.content?.includes('?')).length;
    
    // Generate some random but plausible metrics
    return {
      duration: messages.length * 15, // rough estimate: 15 seconds per message
      sentiment: Math.min(Math.max((Math.random() * 1.2 - 0.3), -1), 1), // slightly biased toward positive
      confidence: 0.5 + (avgMessageLength / 200), // longer messages indicate more confidence (up to a point)
      questionCount,
      keywords: this.extractKeywords(messages)
    };
  }
  
  /**
   * Extract keywords from a set of messages
   */
  private extractKeywords(messages: any[]): string[] {
    // In a real implementation, this would use NLP to extract key phrases
    // For this simulation, we'll return some placeholder keywords
    const commonKeywords = [
      'pricing', 'features', 'integration', 'timeline', 'implementation',
      'support', 'benefits', 'roi', 'competitors', 'demo', 'trial'
    ];
    
    // Select 3-5 random keywords
    const keywordCount = 3 + Math.floor(Math.random() * 3);
    const selectedKeywords = [];
    
    for (let i = 0; i < keywordCount; i++) {
      const randomIndex = Math.floor(Math.random() * commonKeywords.length);
      const keyword = commonKeywords[randomIndex];
      
      if (!selectedKeywords.includes(keyword)) {
        selectedKeywords.push(keyword);
      }
    }
    
    return selectedKeywords;
  }
  
  /**
   * Calculate overall conversation effectiveness score
   */
  private calculateOverallScore(stageMetrics: Record<string, StageMetrics>): number {
    // In a real implementation, this would use a more sophisticated scoring algorithm
    // For now, we'll use a weighted average of sentiment and confidence
    
    const stages = Object.values(stageMetrics);
    if (stages.length === 0) return 0;
    
    // Weight by stage duration
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    if (totalDuration === 0) return 50; // default middle score
    
    const weightedSentiment = stages.reduce(
      (sum, stage) => sum + (stage.sentiment * stage.duration / totalDuration), 
      0
    );
    
    const weightedConfidence = stages.reduce(
      (sum, stage) => sum + (stage.confidence * stage.duration / totalDuration), 
      0
    );
    
    // Calculate score: 60% confidence, 40% sentiment, scaled to 0-100
    const score = (weightedConfidence * 0.6 + (weightedSentiment + 1) / 2 * 0.4) * 100;
    return Math.round(Math.min(Math.max(score, 0), 100));
  }
  
  /**
   * Calculate the total conversation length in seconds
   */
  private calculateConversationLength(callRecord: CallRecord): number {
    const transcript = callRecord.transcript || [];
    if (transcript.length === 0) return 0;
    
    // Estimate 15 seconds per message as a rough approximation
    return transcript.length * 15;
  }
  
  /**
   * Get all conversation heatmaps
   */
  getAllHeatmaps(): ConversationHeatmap[] {
    return Array.from(this.heatmaps.values());
  }
  
  /**
   * Get a specific conversation heatmap
   */
  getHeatmap(callId: string): ConversationHeatmap | undefined {
    return this.heatmaps.get(callId);
  }
  
  /**
   * Generate performance report across all calls
   */
  generatePerformanceReport(): PerformanceReport {
    const heatmaps = this.getAllHeatmaps();
    if (heatmaps.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        conversionRate: 0,
        stageBreakdown: {},
        topPerformingPersonas: []
      };
    }
    
    // Calculate aggregates
    const totalCalls = heatmaps.length;
    const totalDuration = heatmaps.reduce((sum, h) => sum + h.conversationLength, 0);
    const averageDuration = totalDuration / totalCalls;
    
    // Determine conversion rate (simulated)
    const conversions = heatmaps.filter(h => h.overallScore > 75).length;
    const conversionRate = conversions / totalCalls;
    
    // Calculate stage breakdowns
    const stageBreakdown: Record<string, {
      averageDuration: number;
      averageSentiment: number;
      effectiveness: number;
    }> = {};
    
    // Get all stage names used across all heatmaps
    const allStages = new Set<string>();
    heatmaps.forEach(h => {
      Object.keys(h.stages).forEach(stage => allStages.add(stage));
    });
    
    // Calculate metrics for each stage
    allStages.forEach(stageName => {
      let totalStageDuration = 0;
      let totalStageSentiment = 0;
      let stageCount = 0;
      
      heatmaps.forEach(h => {
        const stage = h.stages[stageName];
        if (stage) {
          totalStageDuration += stage.duration;
          totalStageSentiment += stage.sentiment;
          stageCount++;
        }
      });
      
      if (stageCount > 0) {
        stageBreakdown[stageName] = {
          averageDuration: totalStageDuration / stageCount,
          averageSentiment: totalStageSentiment / stageCount,
          effectiveness: (totalStageSentiment / stageCount + 1) / 2 * 100 // scale -1...1 to 0...100
        };
      }
    });
    
    // Calculate top performing personas
    const personaStats = new Map<string, { calls: number; conversions: number }>();
    
    heatmaps.forEach(h => {
      const persona = personaStats.get(h.personaId) || { calls: 0, conversions: 0 };
      persona.calls++;
      if (h.overallScore > 75) {
        persona.conversions++;
      }
      personaStats.set(h.personaId, persona);
    });
    
    const topPerformingPersonas = Array.from(personaStats.entries())
      .map(([personaId, stats]) => ({
        personaId,
        conversionRate: stats.conversions / stats.calls,
        callCount: stats.calls
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);
    
    return {
      totalCalls,
      averageDuration,
      conversionRate,
      stageBreakdown,
      topPerformingPersonas
    };
  }
  
  /**
   * Generate pipeline stage progression data
   */
  generatePipelineData(): PipelineStageData[] {
    // This would normally fetch data from a CRM or other source
    // For now, we'll return simulated pipeline data
    
    return [
      {
        stageName: 'Lead',
        count: 120,
        conversionRate: 0.65,
        averageDaysInStage: 2.3
      },
      {
        stageName: 'Qualified',
        count: 78,
        conversionRate: 0.51,
        averageDaysInStage: 4.7
      },
      {
        stageName: 'Meeting',
        count: 40,
        conversionRate: 0.45,
        averageDaysInStage: 5.2
      },
      {
        stageName: 'Proposal',
        count: 18,
        conversionRate: 0.67,
        averageDaysInStage: 7.5
      },
      {
        stageName: 'Closed',
        count: 12,
        conversionRate: 1.0,
        averageDaysInStage: 0
      }
    ];
  }
}

export const salesIntelligenceService = new SalesIntelligenceService();