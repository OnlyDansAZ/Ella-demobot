# YoBot Production Implementation Guide

## Overview

This document explains how to deploy the YoBot system in a production environment with high-quality voice calls. The key challenge we've identified is integrating ElevenLabs' ultra-realistic voices with SignalWire's telecommunications infrastructure.

## The Challenge

The core issue in the development environment is:

**SignalWire cannot directly access audio files hosted within the Replit environment.** 

When a call is initiated, SignalWire attempts to retrieve the audio files via the `<Play>` verb in LAML (SignalWire's XML markup language), but fails because Replit's hosted URLs are not publicly accessible in a way that SignalWire can reliably reach them.

## Production Solution

The production solution involves:

1. **Cloud-Hosted Audio Files**: Store ElevenLabs-generated MP3 files on a publicly accessible CDN
2. **Optimized Audio Format**: Process audio files for telephony compatibility
3. **Enhanced LAML**: Use `<Play>` verb with cloud-hosted audio URLs

## Implementation Steps

### 1. Set Up Cloud Storage

Choose one of these options to host your audio files:

#### Option A: Amazon S3 (Recommended)

1. Create an S3 bucket in your AWS account
2. Configure the bucket for public read access
3. Add a CORS policy that allows access from SignalWire domains
4. Set up appropriate IAM credentials for uploading files

#### Option B: Cloudflare R2

1. Create an R2 bucket in your Cloudflare account
2. Create a public access Worker to serve the files
3. Configure CORS settings to allow access from SignalWire

#### Option C: Other CDN Options

* DigitalOcean Spaces
* Google Cloud Storage
* Vercel Edge Network (via Next.js API routes)

### 2. Audio Generation & Optimization

For each outbound call:

1. Generate the audio using ElevenLabs API
2. Optimize the audio for telephony using FFmpeg:
   ```bash
   ffmpeg -i input.mp3 -ar 8000 -ac 1 -ab 64k -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" output.mp3
   ```
3. Upload the optimized file to your cloud storage
4. Get the public URL for the file

### 3. Update SignalWire Call Code

Replace the current implementation with this production-grade approach:

```typescript
async function makeOutboundCallWithCDN(to, script, options = {}) {
  // 1. Generate ElevenLabs speech
  const voiceId = options.voice === 'male' ? 'male-voice-id' : 'female-voice-id';
  const speechResult = await generateSpeech(script, voiceId);
  
  // 2. Optimize for telephony
  const optimizedPath = optimizeAudioForTelephony(speechResult.path);
  
  // 3. Upload to cloud storage (S3, R2, etc.)
  const audioUrl = await uploadToCloudStorage(optimizedPath);
  
  // 4. Build LAML with <Play> verb
  const laml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Gather input="speech dtmf" timeout="10" action="${options.actionUrl || '/api/call/response'}" method="POST">
    <Say voice="woman" language="en-US">
      Would you like to learn more about YoBot and what we offer? 
      Say yes or press 1 for pricing information.
      Say no or press 2 to end this call.
    </Say>
  </Gather>
  <Say voice="woman" language="en-US">We didn't receive your response. Thank you for your time. Goodbye.</Say>
</Response>`;
  
  // 5. Make the call with SignalWire
  // ... rest of call code remains the same
}
```

### 4. Utility Tools

For easier implementation, we've created:

1. **Full Documentation**: See `documentation/production-voice-implementation.md` for complete technical details and code examples.

2. **CLI Utility**: Use `scripts/voice-cdn-tool.sh` to generate, optimize and upload audio files in one step.
   ```bash
   # Install required tools
   apt-get install ffmpeg awscli
   
   # Set environment variables
   export ELEVENLABS_API_KEY=your_key_here
   export AWS_ACCESS_KEY_ID=your_key_here
   export AWS_SECRET_ACCESS_KEY=your_key_here
   
   # Generate and upload in one command
   ./scripts/voice-cdn-tool.sh -b your-bucket-name --optimize \
     "Hello, this is Ella from YoBot calling to follow up on our conversation."
   ```

## Testing The Implementation

1. **Verify Audio Access**: Use `curl` to ensure your audio files are publicly accessible:
   ```bash
   curl -I https://your-bucket.s3.amazonaws.com/audio/file.mp3
   # Should return HTTP 200 OK
   ```

2. **Test Call Flow**: Make a test call with the new implementation and verify:
   - Audio plays with high quality
   - Call flow works properly
   - User speech input is correctly captured

## Production Maintenance

1. **Clean Up Old Files**: Implement a cleanup process to remove old audio files:
   ```bash
   # Example AWS CLI command to delete files older than 7 days
   aws s3 ls s3://your-bucket/audio/ --recursive | grep " PRE " | \
     awk '{print $2}' | xargs -I {} aws s3 rm s3://your-bucket/{} --recursive \
     --include "*" --exclude "*$(date +%Y-%m-%d -d "7 days ago")*"
   ```

2. **Monitor Storage Usage**: Set up alerts for unusual storage growth

3. **Optimize Costs**: Consider using AWS Lifecycle Rules to automatically delete old files

## Conclusion

Following this implementation guide will resolve the voice quality limitations and ensure reliable call connectivity in the production environment. The solution leverages best-in-class voice synthesis from ElevenLabs while maintaining the robust call handling capabilities of SignalWire.