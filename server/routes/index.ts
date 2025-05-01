import express from 'express';
import { appointmentRoutes } from './appointmentRoutes';
import { authRoutes } from './authRoutes';
import { conversationRoutes } from './conversationRoutes';
import { signalWireRoutes } from './signalWireRoutes';
import { twilioRoutes } from './twilioRoutes';

const router = express.Router();

router.use('/appointments', appointmentRoutes);
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/signalwire', signalWireRoutes);
router.use('/twilio', twilioRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;