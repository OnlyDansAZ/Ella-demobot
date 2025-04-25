import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { log } from './vite';

// ElevenLabs standard voice IDs - guaranteed to be available
const VOICE_IDS = {
  // Female voices in order of naturalness
  FEMALE_RACHEL: "21m00Tcm4TlvDq8ikWAM", // Rachel - Professional American female voice (BEST FEMALE)
  FEMALE_DOMI: "AZnzlk1XvdvUeBnXmlld",   // Domi - Conversational American female
  FEMALE_BELLA: "EXAVITQu4vr4xnSDxMaL",   // Bella - Warm, friendly female
  FEMALE_ELLI: "MF3mGyEYCl7XYWbV9V6O",    // Elli - Warm, mature female
  
  // Male voices in order of naturalness
  MALE_JOSH: "TxGEqnHWrfWFTfGW9XjX",     // Josh - Professional American male (BEST MALE)
  MALE_ARNOLD: "VR6AewLTigWG4xSOukaG",   // Arnold - Authoritative male
  MALE_ADAM: "pNInz6obpgDQGcFmaJgB",     // Adam - Deep male voice
  MALE_SAM: "yoZ06aMxZJJ28mfd3POQ",      // Sam - Natural male voice
};

// Define directory for storing audio files
export const ELEVENLABS_AUDIO_DIR = path.join(process.cwd(), 'temp');

// Ensure audio directory exists
if (!fs.existsSync(ELEVENLABS_AUDIO_DIR)) {
  fs.mkdirSync(ELEVENLABS_AUDIO_DIR, { recursive: true });
  log(`Created audio directory: ${ELEVENLABS_AUDIO_DIR}`);
}

// Voice settings type for Eleven Labs
export interface ElevenLabsVoiceSettings {
  stability: number;           // Controls stability of voice (0.0 to 1.0)
  similarityBoost: number;     // Controls similarity to source voice (0.0 to 1.0)
  style: number;               // Controls style injection (0.0 to 1.0)
  useSpeakerBoost: boolean;    // Whether to enhance speaker clarity
}

/**
 * Generate speech using ElevenLabs API and save to file
 * This function is optimized for human-like, conversational TTS
 * Enhanced with comprehensive logging, error handling, and file validation
 * 
 * @param text - The text to convert to speech
 * @param voiceId - ElevenLabs voice ID (defaults to female voice)
 * @param voiceSettings - Optional custom voice settings
 * @returns Path to the generated audio file
 */
export async function generateSpeech(
  text: string,
  voiceId: string = VOICE_IDS.FEMALE_RACHEL, // Using Rachel voice by default (most natural standard female)
  voiceSettings?: Partial<ElevenLabsVoiceSettings>
): Promise<string> {
  // Create a session ID for tracking this request through logs
  const sessionId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Starting ElevenLabs speech generation`);
  console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Text length: ${text.length} characters`);
  console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Using voice ID: ${voiceId}`);
  
  try {
    // Validate API key presence
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      const errorMsg = 'ELEVENLABS_API_KEY is not set in environment variables';
      console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Process text to improve speech naturalness and readability
    // These replacements optimize for human-like speech patterns
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Processing text for optimal speech delivery`);
    const processedText = text
      // Remove formatting characters that would affect speech
      .replace(/•\s*/g, "")         // Remove bullet points completely
      .replace(/\*/g, "")           // Remove asterisks completely
      .replace(/-\s+/g, "")         // Remove hyphens followed by whitespace
      .replace(/^\s*-\s*/gm, "")    // Remove hyphens at beginning of lines
      .replace(/\n\s*-\s*/g, "\n")  // Replace newline-hyphen patterns with just newlines
      
      // Improve speech flow with proper pauses
      .replace(/\n+/g, ". ")        // Replace multiple newlines with periods to improve speech flow
      .replace(/\.\s*\./g, ".")     // Replace multiple periods with a single one
      
      // Naturalize number reading
      .replace(/(\d),(\d)/g, "$1$2") // Remove commas in numbers for better reading
      
      // Add subtle pauses for more natural speech rhythm
      .replace(/([.!?])\s+/g, "$1 ... ")  // Add slight pause after end of sentences
      
      // Emphasize questions with slight intonation mark
      .replace(/\?/g, "?~")         // Add subtle emphasis marker after questions
      
      // Improve handling of abbreviations
      .replace(/(\w)\.(\w)/g, "$1,$2") // Convert periods in abbreviations to commas for better pacing
      
      // Final cleanup to remove any artifacts from the above processing
      .replace(/\s{2,}/g, " ")      // Remove extra spaces
      .trim();
    
    // Set default voice settings (optimized for ultra-realistic conversation)
    // These are carefully tuned for maximum naturalness and human-like quality
    const settings: ElevenLabsVoiceSettings = {
      stability: voiceSettings?.stability ?? 0.30,          // Lower stability (0.30) for more natural expression/emotion
      similarityBoost: voiceSettings?.similarityBoost ?? 0.80, // Higher similarity (0.80) for consistent voice character
      style: voiceSettings?.style ?? 0.65,                  // Slightly higher style (0.65) for more personality
      useSpeakerBoost: voiceSettings?.useSpeakerBoost ?? true // Enhanced clarity remains important
    };
    
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Voice settings:`, {
      stability: settings.stability,
      similarityBoost: settings.similarityBoost,
      style: settings.style,
      useSpeakerBoost: settings.useSpeakerBoost
    });
    
    // Generate unique filename with session ID for tracing
    const filename = `speech_${Date.now()}.mp3`;
    const outputPath = path.join(ELEVENLABS_AUDIO_DIR, filename);
    
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Will save to: ${filename}`);
    
    // Call ElevenLabs API
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Making API request to ElevenLabs`);
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const apiStartTime = Date.now();
    
    // Create AbortController for timeout functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // This is the main API request try/catch block
    let response;
    
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
          'User-Agent': 'YoBot-Voice-Assistant/1.0'
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_turbo_v2", // Using the absolute latest & highest quality model
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style,
            use_speaker_boost: settings.useSpeakerBoost
          }
        }),
        signal: controller.signal
      });
      
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      const apiDuration = Date.now() - apiStartTime;
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] ElevenLabs API responded in ${apiDuration}ms with status ${response.status}`);
      
      if (!response.ok) {
        let errorText = '';
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorText = JSON.stringify(errorData);
          console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ElevenLabs API error details:`, errorData);
        } catch (parseError) {
          try {
            errorText = await response.text();
            console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ElevenLabs API error response:`, errorText);
          } catch (textError) {
            errorText = 'Could not parse error response';
            console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Failed to parse ElevenLabs error response`);
          }
        }
        
        // Create detailed error for better debugging
        const error: any = new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
        error.status = response.status;
        error.details = errorData;
        error.sessionId = sessionId;
        throw error;
      }
      
      // Save the audio file with error handling
      try {
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Saving audio response to file`);
        const audioBuffer = await response.buffer();
        
        // Verify we actually got audio data
        if (!audioBuffer || audioBuffer.length < 100) {
          throw new Error(`Invalid audio data received: ${audioBuffer?.length || 0} bytes`);
        }
        
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Received ${audioBuffer.length} bytes of audio data`);
        
        // Create a write stream for better handling of large files
        const writeStream = fs.createWriteStream(outputPath);
        
        // Handle stream errors
        writeStream.on('error', (err) => {
          console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Failed to write audio file:`, err);
        });
        
        // Write the buffer and close the stream
        writeStream.write(audioBuffer);
        writeStream.end();
        
        // Verify the file was written successfully
        if (!fs.existsSync(outputPath)) {
          throw new Error(`File was not created at ${outputPath}`);
        }
        
        const fileStats = fs.statSync(outputPath);
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Successfully saved ${fileStats.size} bytes to ${filename}`);
        
        log(`Generated speech file: ${filename}`);
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Speech generation completed successfully`);
        
        return filename;
      } catch (fileError) {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Failed to save audio file:`, 
          fileError instanceof Error ? fileError.message : 'Unknown file error');
        throw new Error(`Failed to save audio file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    } catch (error) {
      // Make sure to clean up the timeout if fetch fails
      clearTimeout(timeoutId);
      
      const fetchError = error as any;
      
      // Check if this was an abort error (timeout)
      if (fetchError && fetchError.name === 'AbortError') {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ElevenLabs API request timed out after 30 seconds`);
        throw new Error('ElevenLabs API request timed out after 30 seconds');
      }
      
      // Re-throw other errors with better context
      if (error instanceof Error) {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ElevenLabs API request failed:`, error.message);
        throw error;
      } else {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ElevenLabs API request failed with unknown error`);
        throw new Error('Unknown error during ElevenLabs API request');
      }
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Speech generation failed:`, 
      error instanceof Error ? error.message : 'Unknown error');
      
    // Add contextual information to the error for better debugging
    const enhancedError = new Error(`ElevenLabs speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    (enhancedError as any).originalError = error;
    (enhancedError as any).sessionId = sessionId;
    throw enhancedError;
  }
}

/**
 * Get the appropriate voice ID based on gender preference
 * Returns the most natural-sounding standard voice for each gender
 */
export function getVoiceId(gender: 'male' | 'female' = 'female'): string {
  return gender === 'male' ? VOICE_IDS.MALE_JOSH : VOICE_IDS.FEMALE_RACHEL;
}

/**
 * Clean up old audio files (older than 1 hour)
 * Call this periodically to prevent filling disk space
 * Enhanced with better error handling and logging
 */
export function cleanupOldAudioFiles(): void {
  const cleanupId = `cleanup_${Date.now()}`;
  console.log(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] Starting cleanup of old audio files`);
  
  try {
    // Verify the directory exists
    if (!fs.existsSync(ELEVENLABS_AUDIO_DIR)) {
      console.log(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] Audio directory doesn't exist, creating it`);
      fs.mkdirSync(ELEVENLABS_AUDIO_DIR, { recursive: true });
      return; // Nothing to clean up
    }
    
    const now = Date.now();
    const oneHourInMs = 60 * 60 * 1000;
    
    // Read directory with error handling
    let files: string[];
    try {
      files = fs.readdirSync(ELEVENLABS_AUDIO_DIR);
      console.log(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] Found ${files.length} files in audio directory`);
    } catch (readError) {
      console.error(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] [ERROR] Failed to read audio directory:`, 
        readError instanceof Error ? readError.message : 'Unknown error');
      return;
    }
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Process each file
    for (const file of files) {
      // Only process speech files
      if (!file.startsWith('speech_')) continue;
      
      const filePath = path.join(ELEVENLABS_AUDIO_DIR, file);
      
      try {
        // Get file stats
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        const fileAgeMinutes = Math.floor(fileAge / (60 * 1000));
        
        // Delete files older than 1 hour
        if (fileAge > oneHourInMs) {
          // Attempt to delete the file
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] Deleted old audio file: ${file} (${fileAgeMinutes} minutes old)`);
        }
      } catch (fileError) {
        errorCount++;
        console.error(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] [ERROR] Failed to process file ${file}:`, 
          fileError instanceof Error ? fileError.message : 'Unknown error');
        // Continue with other files even if one fails
      }
    }
    
    // Log summary
    console.log(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] Cleanup complete: ${deletedCount} files deleted, ${errorCount} errors`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [CLEANUP:${cleanupId}] [ERROR] Fatal error during cleanup:`, 
      error instanceof Error ? error.message : 'Unknown error');
  }
}