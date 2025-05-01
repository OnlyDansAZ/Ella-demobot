import express from 'express';
import authRoutes from './authRoutes';
import calendarRoutes from './calendarRoutes';
import conversationRoutes from './conversationRoutes';
import personaRoutes from './personaRoutes';
import followupRoutes from './followupRoutes';
import salesIntelligenceRoutes from './salesIntelligenceRoutes';

const router = express.Router();

// API Routes and Health Check
router.use('/auth', authRoutes);
router.use('/calendar', calendarRoutes);
router.use('/conversation', conversationRoutes);
router.use('/persona', personaRoutes);
router.use('/followup', followupRoutes);
router.use('/sales', salesIntelligenceRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export const registerRoutes = (app: Express): Promise<Express> => {
  return new Promise((resolve) => {
    app.use('/api', router);
    resolve(app);
  });
};