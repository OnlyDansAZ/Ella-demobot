# YoBot Ella Developer Guide

## Architecture Overview
Ella is built on a modern web stack with a React frontend and Node.js backend. The application uses a robust storage system with multiple fallbacks, ensuring reliability even when database connections are unstable. Key components include:

- React/TypeScript frontend with Tailwind CSS and shadcn/ui
- Express.js backend with modular route handling
- PostgreSQL database with vector storage capabilities
- ElevenLabs for voice synthesis
- Web Speech API for voice recognition
- Multiple storage layers for resilience

## Key Components

### Theme System
The theme system allows for comprehensive visual customization using CSS variables and dynamic style application.

#### Theme Configuration
Themes are defined in `client/src/lib/themeUtils.ts` and include:
- Primary, secondary, and accent colors
- Automatic light/dark mode detection based on color brightness
- Font size scaling
- Animation controls
- Message bubble opacity and color settings

#### How to Add a New Theme
1. Open `client/src/lib/themeUtils.ts`
2. Add a new theme object to the `defaultThemes` array:
```typescript
{
  id: 'your-theme-id',
  name: 'Your Theme Name',
  primaryColor: '#hexcolor',
  secondaryColor: '#hexcolor',
  accentColor: '#hexcolor',
  description: 'Description of your theme'
}
```
3. The theme will automatically appear in the theme selector

### Persona System
The persona system allows for customizing Ella's behavior and response patterns.

#### Persona Configuration
Personas are defined in `client/src/lib/personas.ts` as objects with:
- ID and name
- Description for user selection
- System prompt that guides the AI's behavior

#### How to Add a New Persona
1. Open `client/src/lib/personas.ts`
2. Add a new persona object to the `predefinedPersonas` array:
```typescript
{
  id: 'your-persona-id',
  name: 'Your Persona Name',
  description: 'Short description of this persona',
  systemPrompt: `Detailed instructions for how Ella should behave...`
}
```
3. The persona will automatically appear in the persona selector

### Voice Recognition System
The voice recognition system uses Web Speech API with enhanced error handling and permission management.

#### Key Components
- `recognitionRef` holds the SpeechRecognition instance
- `startListening()` initiates voice input with permission handling
- `handleRecognitionResult()` processes transcription results
- Confidence scoring to auto-submit high-confidence results

#### Recent Improvements
- Explicit microphone permission requests via MediaDevices API
- Conflict resolution between audio playback and recording
- Enhanced error recovery and recognition restart mechanisms
- Simplified non-continuous mode for more reliable operation

### Voice Synthesis
Voice synthesis uses ElevenLabs API with browser fallback capabilities.

#### Key Components
- Server-side processing in `/api/speech` endpoint
- Text preparation for improved voice quality
- Error handling with Web Speech API fallback

## Storage System

### Multi-tier Storage
The application employs a resilient multi-tier storage system:
1. **Primary**: PostgreSQL database storage
2. **Secondary**: In-memory storage (when database is unavailable)
3. **Tertiary**: File-based backup storage

### Relevant Files
- `server/db.ts` - Database connection and resilience
- `server/storage.ts` - User data storage
- `server/conversationStorage.ts` - Conversation persistence
- `server/appointmentStorage.ts` - Appointment management

## Recent Enhancements

### Database Connection Resilience
- Implemented with retry mechanisms and exponential backoff
- Connection status monitoring
- Automatic fallback to alternative storage options

### Speech Recognition Improvements
- Added explicit microphone permission handling
- Enhanced error recovery for continuous listening
- Improved handling of recognition events
- Conflict resolution between audio playback and recording

## Testing and Debugging

### Common Issues
1. **Database Connection Issues**: Check database status with `isDatabaseAvailable` flag.
2. **Speech Recognition Problems**: Verify browser compatibility and microphone permissions.
3. **Audio Playback Issues**: Check for errors in the console related to audio element playback.

### Debugging Tips
- Use browser console for frontend issues
- Check server logs for backend errors
- Test database connectivity directly when troubleshooting persistent issues

## Future Development Areas

### Potential Improvements
1. **Offline Mode**: Enhanced capabilities when internet connectivity is limited
2. **Additional Integrations**: More external service connections (email, SMS, etc.)
3. **Extended Personalization**: More theme and persona options
4. **Mobile Optimization**: Additional responsive features

## API Reference

### Key Endpoints
- `/api/chat` - Main conversation endpoint
- `/api/speech` - Voice synthesis endpoint
- `/api/conversations/:sessionId/messages` - Message storage
- `/api/appointments` - Appointment management