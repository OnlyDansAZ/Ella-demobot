import express from 'express';
import { callStorage } from '../callStorage';
import { type ChatMessage } from '../conversationStorage';
import { salesIntelligenceService } from '../salesIntelligenceService';

const router = express.Router();

/**
 * Get all conversation heatmaps
 */
router.get('/heatmaps', async (req, res) => {
  try {
    const heatmaps = await salesIntelligenceService.getAllHeatmaps();
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
    const heatmap = await salesIntelligenceService.getHeatmapByCallId(callId);
    
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
    const heatmap = await salesIntelligenceService.generateHeatmapForCall(callId);
    
    if (!heatmap) {
      return res.status(404).json({ error: 'Call not found or failed to generate heatmap' });
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
    const report = await salesIntelligenceService.generatePerformanceReport();
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
    const pipelineData = await salesIntelligenceService.generatePipelineData();
    res.json(pipelineData);
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline data' });
  }
});

export default router;