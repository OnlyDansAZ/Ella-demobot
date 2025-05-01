
import express from 'express';
import authRoutes from './authRoutes';
import calendarRoutes from './calendarRoutes';
import conversationRoutes from './conversationRoutes';
import personaRoutes from './personaRoutes';
import followupRoutes from './followupRoutes';
import salesIntelligenceRoutes from './salesIntelligenceRoutes';

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/calendar', calendarRoutes);
router.use('/conversation', conversationRoutes);
router.use('/persona', personaRoutes);
router.use('/followup', followupRoutes);
router.use('/sales', salesIntelligenceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const registerRoutes = (app: express.Application): express.Application => {
  app.use('/api', router);
  return app;
};
