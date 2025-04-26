import fs from 'fs';
import path from 'path';

/**
 * Music track interface
 */
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number; // in seconds
  path?: string;
  year?: number;
  album?: string;
  isPlaying?: boolean;
}

/**
 * Service for managing music playback
 * This is a basic implementation that simulates music playback
 * In a production environment, this would interface with a real music service
 */
export class MusicService {
  private tracks: Map<string, MusicTrack> = new Map();
  private currentlyPlaying: MusicTrack | null = null;
  private filePath: string = path.join(process.cwd(), 'data', 'music.json');
  
  constructor() {
    this.loadFromFile();
    if (this.tracks.size === 0) {
      this.addSampleTracks();
    }
  }
  
  /**
   * Load music tracks from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf-8');
        const tracksArray: MusicTrack[] = JSON.parse(fileData);
        
        this.tracks.clear();
        tracksArray.forEach(track => {
          this.tracks.set(track.id, track);
        });
        
        console.log(`Loaded ${this.tracks.size} music tracks from file`);
      }
    } catch (error) {
      console.error('Error loading music data:', error);
      // Initialize with sample data if loading fails
      this.addSampleTracks();
    }
  }
  
  /**
   * Save music tracks to file
   */
  private saveToFile() {
    try {
      const tracksArray = Array.from(this.tracks.values());
      fs.writeFileSync(this.filePath, JSON.stringify(tracksArray, null, 2));
      console.log(`Saved ${tracksArray.length} music tracks to file`);
    } catch (error) {
      console.error('Error saving music data:', error);
    }
  }
  
  /**
   * Add sample music tracks
   */
  private addSampleTracks() {
    const sampleTracks: MusicTrack[] = [
      {
        id: '1',
        title: 'Peaceful Morning',
        artist: 'Ambient Sounds',
        genre: 'Ambient',
        duration: 180,
        year: 2023,
        album: 'Relaxation Collection'
      },
      {
        id: '2',
        title: 'Focus Time',
        artist: 'Productive Beats',
        genre: 'Concentration',
        duration: 210,
        year: 2023,
        album: 'Work Flow'
      },
      {
        id: '3',
        title: 'Smooth Jazz Cafe',
        artist: 'Jazz Ensemble',
        genre: 'Jazz',
        duration: 240,
        year: 2022,
        album: 'Cafe Vibes'
      },
      {
        id: '4',
        title: 'Meditation Sounds',
        artist: 'Mindfulness Group',
        genre: 'Meditation',
        duration: 300,
        year: 2023,
        album: 'Deep Calm'
      },
      {
        id: '5',
        title: 'Classical Morning',
        artist: 'Symphony Orchestra',
        genre: 'Classical',
        duration: 270,
        year: 2021,
        album: 'Morning Classics'
      }
    ];
    
    sampleTracks.forEach(track => {
      this.tracks.set(track.id, track);
    });
    
    this.saveToFile();
  }
  
  /**
   * Get all music tracks
   */
  getAllTracks(): MusicTrack[] {
    return Array.from(this.tracks.values());
  }
  
  /**
   * Search for tracks by title, artist, or genre
   */
  searchTracks(query: string): MusicTrack[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tracks.values()).filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist.toLowerCase().includes(lowerQuery) ||
      track.genre.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Play a track by ID
   */
  playTrack(id: string): MusicTrack | null {
    const track = this.tracks.get(id);
    if (track) {
      if (this.currentlyPlaying) {
        this.currentlyPlaying.isPlaying = false;
      }
      track.isPlaying = true;
      this.currentlyPlaying = track;
      return track;
    }
    return null;
  }
  
  /**
   * Stop the currently playing track
   */
  stopPlayback(): boolean {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.isPlaying = false;
      this.currentlyPlaying = null;
      return true;
    }
    return false;
  }
  
  /**
   * Get the currently playing track
   */
  getCurrentTrack(): MusicTrack | null {
    return this.currentlyPlaying;
  }
  
  /**
   * Process a natural language music request
   * This handles requests like "play some jazz" or "play meditation music"
   */
  processRequest(request: string): string {
    const lowerRequest = request.toLowerCase();
    
    // Handle stop/pause requests
    if (lowerRequest.includes('stop') || lowerRequest.includes('pause')) {
      const stopped = this.stopPlayback();
      return stopped 
        ? 'Music playback stopped.' 
        : 'No music is currently playing.';
    }
    
    // Handle play requests
    if (lowerRequest.includes('play')) {
      // First check for genre matches
      const genres = ['ambient', 'concentration', 'jazz', 'meditation', 'classical'];
      
      for (const genre of genres) {
        if (lowerRequest.includes(genre)) {
          const tracks = this.searchTracks(genre);
          if (tracks.length > 0) {
            const track = tracks[0]; // Pick the first matching track
            this.playTrack(track.id);
            return `Playing "${track.title}" by ${track.artist} (${track.genre}).`;
          }
        }
      }
      
      // If no genre matched, look for any keywords in the tracks
      const keywords = lowerRequest.split(' ')
        .filter(word => word.length > 3 && !['play', 'some', 'music', 'please'].includes(word));
      
      for (const keyword of keywords) {
        const tracks = this.searchTracks(keyword);
        if (tracks.length > 0) {
          const track = tracks[0];
          this.playTrack(track.id);
          return `Playing "${track.title}" by ${track.artist}.`;
        }
      }
      
      // If nothing specific was found, pick a random track
      const allTracks = this.getAllTracks();
      if (allTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * allTracks.length);
        const track = allTracks[randomIndex];
        this.playTrack(track.id);
        return `Playing "${track.title}" by ${track.artist}. You can ask for specific genres like jazz, classical, or meditation.`;
      }
    }
    
    // Handle status requests
    if (lowerRequest.includes('what') && (lowerRequest.includes('playing') || lowerRequest.includes('music'))) {
      const current = this.getCurrentTrack();
      return current 
        ? `Currently playing "${current.title}" by ${current.artist}.` 
        : 'No music is currently playing. You can say "play some music" or request a specific genre.';
    }
    
    return "I'm sorry, I didn't understand your music request. You can say things like 'play some jazz' or 'play meditation music'.";
  }
}

// Create and export a singleton instance
export const musicService = new MusicService();