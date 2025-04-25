import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { log } from './vite';

// ElevenLabs voice IDs for commonly used voices
const VOICE_IDS = {
  // Female voices
  FEMALE_RACHEL: "21m00Tcm4TlvDq8ikWAM", // Rachel - Professional American female voice
  FEMALE_DOMI: "AZnzlk1XvdvUeBnXmlld",   // Domi - Conversational American female
  FEMALE_BELLA: "EXAVITQu4vr4xnSDxMaL",   // Bella - Warm, friendly female
  FEMALE_ELLI: "MF3mGyEYCl7XYWbV9V6O",    // Elli - Warm, mature female
  
  // Male voices
  MALE_JOSH: "TxGEqnHWrfWFTfGW9XjX",     // Josh - Professional American male
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
 * 
 * @param text - The text to convert to speech
 * @param voiceId - ElevenLabs voice ID (defaults to female voice)
 * @param voiceSettings - Optional custom voice settings
 * @returns Path to the generated audio file
 */
export async function generateSpeech(
  text: string,
  voiceId: string = VOICE_IDS.FEMALE_DOMI,
  voiceSettings?: Partial<ElevenLabsVoiceSettings>
): Promise<string> {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
    }
    
    // Process text to improve speech readability
    const processedText = text
      .replace(/•\s*/g, "")         // Remove bullet points completely
      .replace(/\*/g, "")           // Remove asterisks completely
      .replace(/-\s+/g, "")         // Remove hyphens followed by whitespace
      .replace(/^\s*-\s*/gm, "")    // Remove hyphens at beginning of lines
      .replace(/\n\s*-\s*/g, "\n")  // Replace newline-hyphen patterns with just newlines
      .replace(/\n+/g, ". ");       // Replace multiple newlines with periods to improve speech flow
    
    // Set default voice settings (optimized for natural conversation)
    const settings: ElevenLabsVoiceSettings = {
      stability: voiceSettings?.stability ?? 0.35,          // Lower for more expressive
      similarityBoost: voiceSettings?.similarityBoost ?? 0.75, // Higher for more consistent
      style: voiceSettings?.style ?? 0.6,                   // Moderate style injection
      useSpeakerBoost: voiceSettings?.useSpeakerBoost ?? true // Enhanced clarity
    };
    
    // Generate unique filename
    const filename = `speech_${Date.now()}.mp3`;
    const outputPath = path.join(ELEVENLABS_AUDIO_DIR, filename);
    
    // Call ElevenLabs API
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: processedText,
        model_id: "eleven_multilingual_v2", // Using the latest model
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarityBoost,
          style: settings.style,
          use_speaker_boost: settings.useSpeakerBoost
        }
      })
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch {
        errorText = await response.text();
      }
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }
    
    // Save the audio file
    const audioBuffer = await response.buffer();
    fs.writeFileSync(outputPath, audioBuffer);
    
    log(`Generated speech file: ${filename}`);
    return filename;
    
  } catch (error) {
    console.error('Error generating speech with ElevenLabs:', error);
    throw error;
  }
}

/**
 * Get the appropriate voice ID based on gender preference
 */
export function getVoiceId(gender: 'male' | 'female' = 'female'): string {
  return gender === 'male' ? VOICE_IDS.MALE_JOSH : VOICE_IDS.FEMALE_DOMI;
}

/**
 * Clean up old audio files (older than 1 hour)
 * Call this periodically to prevent filling disk space
 */
export function cleanupOldAudioFiles(): void {
  try {
    const now = Date.now();
    const oneHourInMs = 60 * 60 * 1000;
    
    const files = fs.readdirSync(ELEVENLABS_AUDIO_DIR);
    
    for (const file of files) {
      if (!file.startsWith('speech_')) continue;
      
      const filePath = path.join(ELEVENLABS_AUDIO_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than 1 hour
      if (now - stats.mtimeMs > oneHourInMs) {
        fs.unlinkSync(filePath);
        log(`Deleted old audio file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old audio files:', error);
  }
}