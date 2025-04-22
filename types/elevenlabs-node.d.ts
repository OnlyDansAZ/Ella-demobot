declare module 'elevenlabs-node' {
  interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  }

  interface TextToSpeechOptions {
    voiceId?: string;
    fileName: string;
    textInput: string;
    stability?: number;
    similarityBoost?: number;
    modelId?: string;
    style?: number;
    speakerBoost?: boolean;
  }

  class ElevenLabs {
    constructor(options: { apiKey: string; voiceId?: string });
    
    textToSpeech(options: TextToSpeechOptions): Promise<{ status: string; fileName: string }>;
    
    getUserInfo(): Promise<any>;
    
    getUserSubscription(): Promise<any>;
  }
  
  export default ElevenLabs;
}