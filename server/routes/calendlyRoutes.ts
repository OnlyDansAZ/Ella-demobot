import { Router } from 'express';

const calendlyRouter = Router();

// Default Calendly URL - this would typically come from environment variables or a database
// We're keeping it in-code for this example, but in production it should be configurable
const DEFAULT_CALENDLY_URL = 'https://calendly.com/yourbusiness/30min';

/**
 * API endpoint to get the Calendly URL
 * GET /api/calendly/url
 * 
 * Returns the URL needed to embed the Calendly scheduling widget
 */
calendlyRouter.get('/url', (req, res) => {
  // Here you could add logic to return different Calendly URLs 
  // based on the user, tier, or other criteria
  
  // For now we'll return the default URL
  return res.json({
    success: true,
    url: DEFAULT_CALENDLY_URL,
    message: 'Calendly URL retrieved successfully'
  });
});

/**
 * API endpoint to get different meeting types
 * GET /api/calendly/meeting-types
 * 
 * Returns available meeting types with their respective URLs
 */
calendlyRouter.get('/meeting-types', (req, res) => {
  // In a real application, these would come from your Calendly integration
  // or be stored in a database
  const meetingTypes = [
    {
      id: 'intro',
      name: 'Introductory Call',
      duration: 30,
      url: 'https://calendly.com/yourbusiness/30min'
    },
    {
      id: 'demo',
      name: 'Product Demo',
      duration: 45,
      url: 'https://calendly.com/yourbusiness/45min'
    },
    {
      id: 'consultation',
      name: 'Consultation',
      duration: 60,
      url: 'https://calendly.com/yourbusiness/60min'
    }
  ];
  
  return res.json({
    success: true,
    meetingTypes,
    message: 'Meeting types retrieved successfully'
  });
});

export default calendlyRouter;