import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { log } from './vite';

// ElevenLabs voice IDs for premium voices - selected for maximum naturalness
const VOICE_IDS = {
  // Premium Female voices - sorted by naturalness for human-like conversations
  FEMALE_GRACE: "wViXBPUzp2ZZixB1xQuM", // Grace - Ultra-natural American female (PREMIUM CHOICE)
  FEMALE_EMILY: "LcfcDJNUP1GQjkzn1xUU", // Emily - Exceptionally natural American female
  FEMALE_RACHEL: "21m00Tcm4TlvDq8ikWAM", // Rachel - Professional American female voice
  FEMALE_DOMI: "AZnzlk1XvdvUeBnXmlld",   // Domi - Conversational American female
  FEMALE_BELLA: "EXAVITQu4vr4xnSDxMaL",   // Bella - Warm, friendly female
  FEMALE_ELLI: "MF3mGyEYCl7XYWbV9V6O",    // Elli - Warm, mature female
  
  // Premium Male voices - sorted by naturalness for human-like conversations
  MALE_THOMAS: "N2lVS1w4EtoT3dr4eOWO", // Thomas - Ultra-natural American male (PREMIUM CHOICE)
  MALE_DANIEL: "onwK4e9ZLuTAKqWW03F9", // Daniel - Exceptionally natural American male
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
  voiceId: string = VOICE_IDS.FEMALE_GRACE, // Using premium Grace voice by default
  voiceSettings?: Partial<ElevenLabsVoiceSettings>
): Promise<string> {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
    }
    
    // Process text to improve speech naturalness and readability
    // These replacements optimize for human-like speech patterns
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
        model_id: "eleven_turbo_v2", // Using the absolute latest & highest quality model
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
 * Returns the most premium, natural-sounding voice for each gender
 */
export function getVoiceId(gender: 'male' | 'female' = 'female'): string {
  return gender === 'male' ? VOICE_IDS.MALE_THOMAS : VOICE_IDS.FEMALE_GRACE;
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