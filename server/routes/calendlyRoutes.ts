import { Router } from 'express';

const router = Router();

/**
 * API endpoint to get the Calendly URL
 * GET /api/calendly/url
 * 
 * Returns the URL needed to embed the Calendly scheduling widget
 */
router.get('/url', (req, res) => {
  // In a production app, this URL could be stored in a database or environment variable
  // For now, we'll use a default example URL
  const calendlyUrl = 'https://calendly.com/yourbusiness/30min';
  
  res.json({
    success: true,
    url: calendlyUrl
  });
});

/**
 * API endpoint to get different meeting types
 * GET /api/calendly/meeting-types
 * 
 * Returns available meeting types with their respective URLs
 */
router.get('/meeting-types', (req, res) => {
  // In a production app, these would be dynamically fetched from Calendly's API
  // For now, we'll return some example meeting types
  const meetingTypes = [
    {
      id: '30min',
      name: '30 Minute Meeting',
      description: 'A short consultation or introduction call',
      url: 'https://calendly.com/yourbusiness/30min'
    },
    {
      id: '60min',
      name: '60 Minute Meeting',
      description: 'A comprehensive consultation or demo session',
      url: 'https://calendly.com/yourbusiness/60min'
    },
    {
      id: 'product-demo',
      name: 'Product Demo',
      description: 'Get a full demonstration of the YoBot platform',
      url: 'https://calendly.com/yourbusiness/product-demo'
    }
  ];
  
  res.json({
    success: true,
    meetingTypes
  });
});

export default router;