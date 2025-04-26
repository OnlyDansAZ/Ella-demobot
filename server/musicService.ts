import fs from 'fs';
import path from 'path';

/**
 * Music track structure
 */
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  genre?: string;
  year?: number;
  url?: string; // URL to audio file or streaming source
}

/**
 * Playlist structure
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: string[]; // Track IDs
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for managing music tracks and playlists
 */
export class MusicService {
  private tracks: Map<string, MusicTrack> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'music.json');
  
  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.loadFromFile();
    
    // Add sample tracks and playlists if none exist
    if (this.tracks.size === 0) {
      this.addSampleTracks();
    }
    
    if (this.playlists.size === 0) {
      this.addSamplePlaylists();
    }
    
    this.saveToFile();
  }
  
  /**
   * Load music data from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed.tracks && Array.isArray(parsed.tracks)) {
          this.tracks.clear();
          
          for (const track of parsed.tracks) {
            this.tracks.set(track.id, track);
          }
          
          console.log(`Loaded ${this.tracks.size} music tracks from file`);
        }
        
        if (parsed.playlists && Array.isArray(parsed.playlists)) {
          this.playlists.clear();
          
          for (const playlist of parsed.playlists) {
            this.playlists.set(playlist.id, playlist);
          }
          
          console.log(`Loaded ${this.playlists.size} playlists from file`);
        }
      }
    } catch (error) {
      console.error('Error loading music data from file:', error);
    }
  }
  
  /**
   * Save music data to file
   */
  private saveToFile() {
    try {
      const data = JSON.stringify({
        tracks: Array.from(this.tracks.values()),
        playlists: Array.from(this.playlists.values())
      }, null, 2);
      
      fs.writeFileSync(this.filePath, data);
      console.log(`Saved ${this.tracks.size} tracks and ${this.playlists.size} playlists to file`);
    } catch (error) {
      console.error('Error saving music data to file:', error);
    }
  }
  
  /**
   * Add sample music tracks
   */
  private addSampleTracks() {
    // Sample tracks (royalty-free music examples)
    const sampleTracks: MusicTrack[] = [
      {
        id: 'track-1',
        title: 'Relaxing Ambience',
        artist: 'Ambient Sounds',
        album: 'Peaceful Moments',
        duration: 180, // 3 minutes
        genre: 'Ambient',
        year: 2023
      },
      {
        id: 'track-2',
        title: 'Productive Focus',
        artist: 'Deep Work',
        album: 'Concentration',
        duration: 240, // 4 minutes
        genre: 'Focus',
        year: 2023
      },
      {
        id: 'track-3',
        title: 'Upbeat Energy',
        artist: 'Motivation',
        album: 'Get Moving',
        duration: 210, // 3.5 minutes
        genre: 'Electronic',
        year: 2023
      },
      {
        id: 'track-4',
        title: 'Calm Waters',
        artist: 'Nature Sounds',
        album: 'Ocean Vibes',
        duration: 300, // 5 minutes
        genre: 'Nature',
        year: 2023
      },
      {
        id: 'track-5',
        title: 'Smooth Jazz',
        artist: 'Jazz Ensemble',
        album: 'Evening Jazz',
        duration: 270, // 4.5 minutes
        genre: 'Jazz',
        year: 2023
      }
    ];
    
    for (const track of sampleTracks) {
      this.tracks.set(track.id, track);
    }
  }
  
  /**
   * Add sample playlists
   */
  private addSamplePlaylists() {
    const now = new Date().toISOString();
    
    // Sample playlists
    const samplePlaylists: Playlist[] = [
      {
        id: 'playlist-1',
        name: 'Focus Time',
        description: 'Music to help you concentrate',
        tracks: ['track-2', 'track-4'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'playlist-2',
        name: 'Relaxation',
        description: 'Calming music for relaxation',
        tracks: ['track-1', 'track-4', 'track-5'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'playlist-3',
        name: 'Energy Boost',
        description: 'Music to boost your energy',
        tracks: ['track-3'],
        createdAt: now,
        updatedAt: now
      }
    ];
    
    for (const playlist of samplePlaylists) {
      this.playlists.set(playlist.id, playlist);
    }
  }
  
  /**
   * Get all music tracks
   */
  getAllTracks(): MusicTrack[] {
    return Array.from(this.tracks.values());
  }
  
  /**
   * Get all playlists
   */
  getAllPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }
  
  /**
   * Get a track by ID
   * @param id Track ID
   */
  getTrack(id: string): MusicTrack | null {
    return this.tracks.get(id) || null;
  }
  
  /**
   * Get a playlist by ID
   * @param id Playlist ID
   */
  getPlaylist(id: string): Playlist | null {
    return this.playlists.get(id) || null;
  }
  
  /**
   * Get tracks in a playlist
   * @param playlistId Playlist ID
   */
  getPlaylistTracks(playlistId: string): MusicTrack[] {
    const playlist = this.playlists.get(playlistId);
    
    if (!playlist) {
      return [];
    }
    
    return playlist.tracks
      .map(trackId => this.tracks.get(trackId))
      .filter((track): track is MusicTrack => track !== undefined);
  }
  
  /**
   * Search for tracks by title, artist, or album
   * @param query Search query
   */
  searchTracks(query: string): MusicTrack[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.tracks.values()).filter(track => {
      return (
        track.title.toLowerCase().includes(lowerQuery) ||
        track.artist.toLowerCase().includes(lowerQuery) ||
        (track.album && track.album.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  /**
   * Search for playlists by name or description
   * @param query Search query
   */
  searchPlaylists(query: string): Playlist[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.playlists.values()).filter(playlist => {
      return (
        playlist.name.toLowerCase().includes(lowerQuery) ||
        (playlist.description && playlist.description.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  /**
   * Get a formatted description of available music
   */
  getMusicCatalogSummary(): string {
    const tracks = this.getAllTracks();
    const playlists = this.getAllPlaylists();
    
    let summary = `Music Catalog Summary:\n\n`;
    
    summary += `Available Tracks (${tracks.length}):\n`;
    tracks.forEach(track => {
      summary += `- "${track.title}" by ${track.artist} (${track.genre || 'Unknown Genre'})\n`;
    });
    
    summary += `\nAvailable Playlists (${playlists.length}):\n`;
    playlists.forEach(playlist => {
      const trackCount = playlist.tracks.length;
      summary += `- ${playlist.name} (${trackCount} track${trackCount !== 1 ? 's' : ''})\n`;
      if (playlist.description) {
        summary += `  ${playlist.description}\n`;
      }
    });
    
    return summary;
  }
  
  /**
   * Get a message for playing a specific track
   * @param trackId Track ID
   */
  getPlayTrackMessage(trackId: string): string {
    const track = this.getTrack(trackId);
    
    if (!track) {
      return `Sorry, I couldn't find that track in the music library.`;
    }
    
    return `Now playing "${track.title}" by ${track.artist}. This track is ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')} minutes long.`;
  }
  
  /**
   * Get a message for playing a specific playlist
   * @param playlistId Playlist ID
   */
  getPlayPlaylistMessage(playlistId: string): string {
    const playlist = this.getPlaylist(playlistId);
    
    if (!playlist) {
      return `Sorry, I couldn't find that playlist in the music library.`;
    }
    
    const tracks = this.getPlaylistTracks(playlistId);
    const totalDuration = tracks.reduce((total, track) => total + track.duration, 0);
    const minutes = Math.floor(totalDuration / 60);
    const seconds = totalDuration % 60;
    
    return `Now playing playlist "${playlist.name}" with ${tracks.length} tracks. Total duration: ${minutes}:${seconds.toString().padStart(2, '0')} minutes.`;
  }
  
  /**
   * Process a natural language request for music
   * @param request User's music request
   */
  processRequest(request: string): string {
    const lowerRequest = request.toLowerCase();
    
    // Check for play requests by track name
    if (lowerRequest.includes('play') || lowerRequest.includes('listen')) {
      // Check for playlist requests
      if (lowerRequest.includes('playlist')) {
        const playlists = this.getAllPlaylists();
        for (const playlist of playlists) {
          if (lowerRequest.includes(playlist.name.toLowerCase())) {
            return this.getPlayPlaylistMessage(playlist.id);
          }
        }
      }
      
      // Check for track requests
      const tracks = this.getAllTracks();
      for (const track of tracks) {
        if (lowerRequest.includes(track.title.toLowerCase())) {
          return this.getPlayTrackMessage(track.id);
        }
      }
      
      // Check for artist requests
      const artistMatches = tracks.filter(track => 
        lowerRequest.includes(track.artist.toLowerCase())
      );
      
      if (artistMatches.length > 0) {
        return this.getPlayTrackMessage(artistMatches[0].id);
      }
      
      // Check for genre requests
      const genreMatches = tracks.filter(track => 
        track.genre && lowerRequest.includes(track.genre.toLowerCase())
      );
      
      if (genreMatches.length > 0) {
        return this.getPlayTrackMessage(genreMatches[0].id);
      }
    }
    
    // If no specific request matched, return the catalog summary
    if (lowerRequest.includes('music') || lowerRequest.includes('song') || lowerRequest.includes('track')) {
      return this.getMusicCatalogSummary();
    }
    
    return `I can play music for you. Try asking for a specific track, artist, or playlist.`;
  }
}

// Export a singleton instance
export const musicService = new MusicService();