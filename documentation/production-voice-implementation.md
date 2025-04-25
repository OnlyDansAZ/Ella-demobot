# YoBot Production Voice Implementation Guide

## Overview

This document provides a comprehensive guide for implementing a production-grade voice call system that uses ElevenLabs for ultra-realistic text-to-speech and SignalWire for telecommunications infrastructure. This approach replaces the default robotic voice with studio-quality audio to create a truly human-like AI calling experience.

## Architecture Overview

The system follows this high-level flow:

1. **Audio Generation**: Generate high-quality speech using ElevenLabs API
2. **Audio Optimization**: Process audio files for telephony compatibility  
3. **Public Hosting**: Upload optimized audio to a CDN/cloud storage
4. **Call Execution**: Use SignalWire with `<Play>` to deliver the audio files
5. **Response Handling**: Process call interactions and responses

## 1. Audio Generation

### API Call to ElevenLabs

```typescript
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique filename
const generateAudioFilename = (persona = 'default', extension = 'mp3') => {
  const timestamp = Date.now();
  const hash = uuidv4().substring(0, 8);
  return `${persona}-${timestamp}-${hash}.${extension}`;
};

// ElevenLabs voice settings for optimal phone call quality
const getVoiceSettings = (voice = 'default') => {
  // Phone call optimized settings
  return {
    stability: 0.55,       // Slightly higher stability for clearer phone calls
    similarityBoost: 0.75, // Good balance of character voice and clarity
    style: 0.3,            // Lower style to sound more conversational/less dramatic
    useSpeakerBoost: true  // Enhance clarity for telephony
  };
};

// Main function to generate speech
async function generateSpeech(text, voiceId, options = {}) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('Missing ElevenLabs API key');
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
  
  // Voice settings optimized for phone calls
  const voiceSettings = getVoiceSettings(options.voice);
  
  // Generate a unique filename based on persona
  const filename = options.filename || generateAudioFilename(options.persona);
  
  // Make sure output directory exists
  const outputDir = options.outputDir || path.join(process.cwd(), 'audio');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, filename);
  
  // Request body
  const requestBody = {
    text,
    model_id: "eleven_monolingual_v1",
    voice_settings: voiceSettings
  };
  
  try {
    // Make API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }
    
    // Get the audio data as a buffer
    const audioBuffer = await response.buffer();
    
    // Save the audio file
    fs.writeFileSync(outputPath, audioBuffer);
    
    console.log(`Generated audio file: ${outputPath} (${audioBuffer.length} bytes)`);
    
    return {
      filename,
      path: outputPath,
      size: audioBuffer.length
    };
  } catch (error) {
    console.error('Error generating speech with ElevenLabs:', error);
    throw error;
  }
}
```

## 2. Audio Optimization for Telephony

Telephone networks have specific audio constraints. For optimal clarity, audio files should be converted to telephony-friendly formats using FFmpeg.

### FFmpeg Audio Processing

```typescript
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Optimize audio for telephony networks
 * @param inputPath Path to the input audio file
 * @param outputPath Optional custom output path
 * @returns Path to the optimized audio file
 */
function optimizeAudioForTelephony(inputPath, outputPath = '') {
  // If no output path is provided, create one
  if (!outputPath) {
    const parsedPath = path.parse(inputPath);
    outputPath = path.join(
      parsedPath.dir, 
      `${parsedPath.name}_optimized${parsedPath.ext}`
    );
  }
  
  try {
    // FFmpeg command to optimize audio for telephony:
    // - Set sample rate to 8kHz (telephone standard)
    // - Convert to mono (single channel)
    // - Set bitrate to 64kbps (good quality for phone)
    // - Normalize audio (-filter:a "loudnorm") for consistent volume
    const command = `ffmpeg -i "${inputPath}" -ar 8000 -ac 1 -ab 64k -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" "${outputPath}"`;
    
    // Execute the command
    execSync(command);
    
    console.log(`Optimized audio saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error optimizing audio with FFmpeg:', error);
    throw error;
  }
}
```

### Optional: Test Audio Quality

```typescript
function validateAudioFile(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file does not exist: ${filePath}`);
  }
  
  // Check file size (should be non-zero)
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new Error(`Audio file is empty: ${filePath}`);
  }
  
  // For more advanced validation, you could use ffprobe
  // to check audio properties like codec, bit rate, etc.
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const duration = parseFloat(execSync(command).toString().trim());
    
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Invalid audio duration: ${duration}`);
    }
    
    return {
      path: filePath,
      size: stats.size,
      duration
    };
  } catch (error) {
    console.error('Error validating audio file:', error);
    throw error;
  }
}
```

## 3. Cloud Storage / CDN Setup

### AWS S3 Implementation

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload audio file to S3 bucket
 * @param filePath Local path to the audio file
 * @param bucketName S3 bucket name
 * @param key Optional custom S3 key (filename)
 * @returns Public URL of the uploaded file
 */
async function uploadAudioToS3(filePath, bucketName, key = '') {
  if (!bucketName) {
    throw new Error('S3 bucket name is required');
  }
  
  // If no key is provided, use the original filename
  if (!key) {
    key = `audio/${path.basename(filePath)}`;
  }
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'audio/mpeg',
      ACL: 'public-read' // Make it publicly accessible
    });
    
    await s3Client.send(command);
    
    // Generate public URL
    const publicUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
    
    console.log(`Uploaded audio to S3: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading audio to S3:', error);
    throw error;
  }
}
```

### Cloudflare R2 Implementation

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Initialize R2 client (compatible with S3 API)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

/**
 * Upload audio file to Cloudflare R2
 * @param filePath Local path to the audio file
 * @param bucketName R2 bucket name
 * @param key Optional custom object key (filename)
 * @returns Public URL of the uploaded file
 */
async function uploadAudioToR2(filePath, bucketName, key = '') {
  if (!bucketName) {
    throw new Error('R2 bucket name is required');
  }
  
  // If no key is provided, use the original filename
  if (!key) {
    key = `audio/${path.basename(filePath)}`;
  }
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'audio/mpeg',
    });
    
    await r2Client.send(command);
    
    // For R2, you need to use your Cloudflare domain or public endpoint
    // Set up a custom domain or Workers Site to serve these files
    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
    
    console.log(`Uploaded audio to R2: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading audio to R2:', error);
    throw error;
  }
}
```

## 4. SignalWire Call Implementation with Audio

Now that we have public URLs for our audio files, we can use the `<Play>` verb in SignalWire's LAML to deliver high-quality audio:

```typescript
import fetch from 'node-fetch';

/**
 * Make an outbound call using SignalWire with high-quality ElevenLabs audio
 * @param to Destination phone number
 * @param audioUrl Public URL to the audio file
 * @param options Additional call options
 * @returns SignalWire call object
 */
async function makeOutboundCallWithAudio(to, audioUrl, options = {}) {
  // Validate input
  if (!to) {
    throw new Error('Destination phone number is required');
  }
  
  if (!audioUrl) {
    throw new Error('Audio URL is required');
  }
  
  // Clean the phone numbers (ensure E.164 format)
  const cleanToNumber = to.replace(/[\s()]/g, '');
  if (!cleanToNumber.match(/^\+?[1-9]\d{1,14}$/)) {
    throw new Error('Invalid destination phone number format. Use E.164 format (e.g., +15551234567)');
  }
  
  // Get SignalWire credentials from environment
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
  const fromNumber = process.env.SIGNALWIRE_PHONE_NUMBER;
  
  if (!projectId || !token || !spaceUrl || !fromNumber) {
    throw new Error('Missing SignalWire credentials');
  }
  
  // Prepare the from number
  let cleanFromNumber = fromNumber.replace(/[\s()]/g, '');
  if (!cleanFromNumber.startsWith('+')) {
    cleanFromNumber = '+' + cleanFromNumber;
  }
  
  // Build the LAML with Play verb
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
  
  // API endpoint for making calls
  const apiEndpoint = `https://${spaceUrl}.signalwire.com/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
  
  // Prepare form data for the API call
  const formData = new URLSearchParams();
  formData.append('To', cleanToNumber);
  formData.append('From', cleanFromNumber);
  formData.append('Twiml', laml);
  formData.append('StatusCallback', options.statusCallback || '/api/call/status');
  formData.append('StatusCallbackMethod', 'POST');
  formData.append('Timeout', options.timeout || '60');
  formData.append('MachineDetection', 'Enable');
  formData.append('IfMachine', 'Continue');
  formData.append('Record', options.record || 'false');
  
  try {
    // Make the API call
    const auth = Buffer.from(`${projectId}:${token}`).toString('base64');
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SignalWire API error (${response.status}): ${errorText}`);
    }
    
    const callData = await response.json();
    console.log('SignalWire call created successfully:', callData.sid);
    
    return callData;
  } catch (error) {
    console.error('Error making outbound call with SignalWire:', error);
    throw error;
  }
}
```

## 5. Complete Call Flow with Realistic Voice

Putting it all together, here's a complete end-to-end implementation function:

```typescript
/**
 * Create and execute a production-grade voice call with ElevenLabs and SignalWire
 * @param to Destination phone number
 * @param script Text content to convert to speech
 * @param options Additional options
 */
async function makeProductionGradeCall(to, script, options = {}) {
  try {
    // 1. Generate speech with ElevenLabs
    const voiceId = options.voice === 'male' ? 'male-voice-id' : 'female-voice-id';
    const speechResult = await generateSpeech(script, voiceId, {
      persona: options.persona || 'default'
    });
    
    // 2. Optimize the audio for telephony
    const optimizedPath = await optimizeAudioForTelephony(speechResult.path);
    
    // 3. Upload to cloud storage/CDN
    const audioUrl = await uploadAudioToS3(
      optimizedPath, 
      process.env.S3_BUCKET_NAME, 
      `audio/${options.persona || 'default'}/${path.basename(optimizedPath)}`
    );
    
    // Validate the audio URL is publicly accessible
    await validatePublicUrl(audioUrl);
    
    // 4. Make the call with SignalWire using the hosted audio
    const call = await makeOutboundCallWithAudio(to, audioUrl, {
      actionUrl: options.actionUrl,
      statusCallback: options.statusCallback,
      timeout: options.timeout,
      record: options.record
    });
    
    return {
      callId: call.sid,
      status: call.status,
      audioUrl,
      details: call
    };
  } catch (error) {
    console.error('Error making production-grade call:', error);
    throw error;
  }
}

/**
 * Validate that a URL is publicly accessible
 * @param url URL to validate
 * @returns Boolean indicating if the URL is valid and accessible
 */
async function validatePublicUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      throw new Error(`URL returned status ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('audio')) {
      console.warn(`URL does not appear to be an audio file: ${contentType}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    throw new Error(`The audio URL is not publicly accessible: ${error.message}`);
  }
}
```

## Bonus: Utility Script for Audio Management

Here's a complete utility script that can be used as a CLI tool for managing audio files:

```typescript
#!/usr/bin/env node
// voice-manager.js

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');
const AWS = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new AWS.S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

program
  .name('voice-manager')
  .description('Utility to manage voice audio files for telephony')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate speech from text using ElevenLabs')
  .requiredOption('-t, --text <text>', 'Text to convert to speech')
  .option('-v, --voice <id>', 'ElevenLabs voice ID', 'DEFAULT_VOICE_ID')
  .option('-o, --output <file>', 'Output file path')
  .option('-p, --persona <name>', 'Persona name', 'default')
  .action(async (options) => {
    try {
      console.log('Generating speech...');
      // Generate filename if not provided
      if (!options.output) {
        const timestamp = Date.now();
        options.output = path.join(process.cwd(), 'audio', `${options.persona}-${timestamp}.mp3`);
      }
      
      // Create output directory if it doesn't exist
      const dir = path.dirname(options.output);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Generate speech with ElevenLabs
      await generateSpeech(options.text, options.voice, { 
        outputPath: options.output,
        persona: options.persona
      });
      
      console.log(`Speech generated successfully: ${options.output}`);
    } catch (error) {
      console.error('Error generating speech:', error);
      process.exit(1);
    }
  });

program
  .command('optimize')
  .description('Optimize audio file for telephony')
  .requiredOption('-i, --input <file>', 'Input audio file')
  .option('-o, --output <file>', 'Output file path')
  .action((options) => {
    try {
      console.log('Optimizing audio for telephony...');
      
      // Generate output filename if not provided
      if (!options.output) {
        const parsed = path.parse(options.input);
        options.output = path.join(parsed.dir, `${parsed.name}_optimized${parsed.ext}`);
      }
      
      // Optimize audio
      optimizeAudioForTelephony(options.input, options.output);
      
      console.log(`Audio optimized successfully: ${options.output}`);
    } catch (error) {
      console.error('Error optimizing audio:', error);
      process.exit(1);
    }
  });

program
  .command('upload')
  .description('Upload audio file to cloud storage')
  .requiredOption('-i, --input <file>', 'Input audio file')
  .option('-b, --bucket <name>', 'S3 bucket name', process.env.S3_BUCKET_NAME)
  .option('-k, --key <key>', 'S3 object key (path/filename)')
  .action(async (options) => {
    try {
      console.log('Uploading audio to cloud storage...');
      
      if (!options.bucket) {
        throw new Error('S3 bucket name is required (use --bucket or set S3_BUCKET_NAME env variable)');
      }
      
      // Generate key if not provided
      if (!options.key) {
        options.key = `audio/${path.basename(options.input)}`;
      }
      
      // Upload to S3
      const url = await uploadAudioToS3(options.input, options.bucket, options.key);
      
      console.log(`Audio uploaded successfully: ${url}`);
    } catch (error) {
      console.error('Error uploading audio:', error);
      process.exit(1);
    }
  });

program
  .command('call')
  .description('Make a call with the specified audio')
  .requiredOption('-t, --to <number>', 'Destination phone number')
  .requiredOption('-a, --audio <url>', 'Audio file URL')
  .option('-c, --callback <url>', 'Status callback URL')
  .action(async (options) => {
    try {
      console.log(`Making call to ${options.to} with audio ${options.audio}...`);
      
      // Make call
      const call = await makeOutboundCallWithAudio(options.to, options.audio, {
        statusCallback: options.callback
      });
      
      console.log(`Call initiated successfully: ${call.sid}`);
    } catch (error) {
      console.error('Error making call:', error);
      process.exit(1);
    }
  });

program
  .command('run-all')
  .description('Run the complete process: generate, optimize, upload, and call')
  .requiredOption('-t, --to <number>', 'Destination phone number')
  .requiredOption('--text <text>', 'Text to convert to speech')
  .option('-v, --voice <id>', 'ElevenLabs voice ID', 'DEFAULT_VOICE_ID')
  .option('-p, --persona <name>', 'Persona name', 'default')
  .option('-b, --bucket <name>', 'S3 bucket name', process.env.S3_BUCKET_NAME)
  .action(async (options) => {
    try {
      console.log('Running complete voice call process...');
      
      // Generate temporary filenames
      const timestamp = Date.now();
      const baseName = `${options.persona}-${timestamp}`;
      const audioPath = path.join(process.cwd(), 'audio', `${baseName}.mp3`);
      const optimizedPath = path.join(process.cwd(), 'audio', `${baseName}_optimized.mp3`);
      
      // 1. Generate speech
      console.log('Step 1: Generating speech...');
      await generateSpeech(options.text, options.voice, { outputPath: audioPath });
      
      // 2. Optimize audio
      console.log('Step 2: Optimizing audio...');
      optimizeAudioForTelephony(audioPath, optimizedPath);
      
      // 3. Upload to cloud
      console.log('Step 3: Uploading to cloud storage...');
      const audioUrl = await uploadAudioToS3(
        optimizedPath, 
        options.bucket, 
        `audio/${options.persona}/${path.basename(optimizedPath)}`
      );
      
      // 4. Make call
      console.log('Step 4: Initiating call...');
      const call = await makeOutboundCallWithAudio(options.to, audioUrl);
      
      console.log('\nCall process completed successfully:');
      console.log(`- Call SID: ${call.sid}`);
      console.log(`- Status: ${call.status}`);
      console.log(`- Audio URL: ${audioUrl}`);
    } catch (error) {
      console.error('Error in voice call process:', error);
      process.exit(1);
    }
  });

program.parse();
```

## Production Considerations

1. **Error Handling and Retry Logic**:
   - Implement exponential backoff for API retries
   - Handle network failures gracefully
   - Add monitoring for critical failures

2. **Scaling and Performance**:
   - Pre-generate common messages for faster response
   - Implement caching for frequent messages
   - Use a CDN with global distribution for lowest latency

3. **Security Considerations**:
   - Use signed URLs for protected content when needed
   - Rotate credentials regularly
   - Implement proper access controls on S3/R2 buckets

4. **Cost Optimization**:
   - Set up lifecycle policies to delete old audio files
   - Compress audio appropriately (balance quality vs. size)
   - Monitor usage and set up alerts for unusual patterns

5. **Monitoring and Analytics**:
   - Track call quality metrics
   - Monitor latency of audio playback
   - Analyze user engagement and response rates

## Conclusion

This guide provides the blueprint for implementing a production-grade voice call system with ultra-realistic speech. By using ElevenLabs for TTS, optimizing the audio for telephony, hosting on a global CDN, and delivering with SignalWire, you can create voice interactions that are nearly indistinguishable from human conversations.

The key advantage of this approach is the ability to leverage the best-in-class voice synthesis without being limited by the built-in TTS capabilities of telecommunication platforms.