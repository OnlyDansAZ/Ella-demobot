import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createReadStream } from 'fs';
import * as path from 'path';
import { logError, logInfo, logDebug } from '../utils/logger';

/**
 * Google Drive integration service
 * 
 * This service provides functionality to interact with Google Drive
 * allowing Ella to upload, download, and manage files.
 */

// Constants for Google OAuth
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Initialize Google OAuth client and Drive API client
let oAuth2Client: OAuth2Client | null = null;
let driveClient: drive_v3.Drive | null = null;
let isDriveAvailable = false;

/**
 * Initialize the Google Drive integration
 * 
 * @returns Whether initialization was successful
 */
export async function initializeGoogleDrive(): Promise<boolean> {
  try {
    // Check for required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      logInfo('Google Drive integration disabled: Missing required OAuth credentials');
      return false;
    }
    
    // Create OAuth client (we can reuse the same client for multiple Google services)
    oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    
    // Check if we have a refresh token
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (refreshToken) {
      // Set credentials with refresh token
      oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });
      
      // Initialize the drive client
      driveClient = google.drive({ version: 'v3', auth: oAuth2Client });
      isDriveAvailable = true;
      
      logInfo('Google Drive integration initialized successfully');
      return true;
    } else {
      logInfo('Google Drive integration disabled: No refresh token available');
      return false;
    }
  } catch (error) {
    logError('Failed to initialize Google Drive integration', error);
    return false;
  }
}

/**
 * Check if Google Drive integration is available
 */
export function isGoogleDriveAvailable(): boolean {
  return isDriveAvailable && driveClient !== null;
}

/**
 * Generate the OAuth URL for the user to authorize the application
 * 
 * @returns The authorization URL or null if OAuth client is not initialized
 */
export function getDriveAuthorizationUrl(): string | null {
  if (!oAuth2Client) {
    logError('Cannot generate auth URL - OAuth client not initialized');
    return null;
  }
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });
}

/**
 * Handle the OAuth callback and obtain tokens
 * 
 * @param code - The authorization code from the OAuth callback
 * @returns Whether the token was successfully obtained
 */
export async function handleDriveOAuthCallback(code: string): Promise<boolean> {
  if (!oAuth2Client) {
    logError('Cannot handle callback - OAuth client not initialized');
    return false;
  }
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Store the refresh token (should be securely stored in production)
    if (tokens.refresh_token) {
      logInfo('Obtained refresh token for Google Drive. Store this securely: ' + tokens.refresh_token);
    } else {
      logWarn('No refresh token returned. You may need to revoke access and try again with prompt=consent');
    }
    
    // Initialize the drive client
    driveClient = google.drive({ version: 'v3', auth: oAuth2Client });
    isDriveAvailable = true;
    
    return true;
  } catch (error) {
    logError('Error handling OAuth callback for Google Drive', error);
    return false;
  }
}

/**
 * List files in a specific folder
 * 
 * @param folderId - ID of the folder to list files from (default: 'root')
 * @param maxResults - Maximum number of files to return
 * @returns List of files or null if retrieval failed
 */
export async function listFiles(
  folderId: string = 'root',
  maxResults: number = 100
): Promise<drive_v3.Schema$File[] | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot list files - Google Drive integration not available');
    return null;
  }
  
  try {
    const response = await driveClient!.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, webViewLink, iconLink, createdTime, modifiedTime, size)',
    });
    
    return response.data.files || [];
  } catch (error) {
    logError('Error listing files from Google Drive', error);
    return null;
  }
}

/**
 * Search for files by name or content
 * 
 * @param query - Search query
 * @param maxResults - Maximum number of files to return
 * @returns List of matching files or null if search failed
 */
export async function searchFiles(
  query: string,
  maxResults: number = 10
): Promise<drive_v3.Schema$File[] | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot search files - Google Drive integration not available');
    return null;
  }
  
  try {
    const response = await driveClient!.files.list({
      q: `name contains '${query}' or fullText contains '${query}' and trashed = false`,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, webViewLink, iconLink, createdTime, modifiedTime, size)',
    });
    
    return response.data.files || [];
  } catch (error) {
    logError('Error searching files in Google Drive', error);
    return null;
  }
}

/**
 * Get file metadata
 * 
 * @param fileId - ID of the file to get metadata for
 * @returns File metadata or null if retrieval failed
 */
export async function getFileMetadata(fileId: string): Promise<drive_v3.Schema$File | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot get file metadata - Google Drive integration not available');
    return null;
  }
  
  try {
    const response = await driveClient!.files.get({
      fileId,
      fields: 'id, name, mimeType, webViewLink, iconLink, createdTime, modifiedTime, size, description, owners, shared',
    });
    
    return response.data;
  } catch (error) {
    logError(`Error getting metadata for file ${fileId}`, error);
    return null;
  }
}

/**
 * Create a folder
 * 
 * @param folderName - Name of the folder to create
 * @param parentFolderId - ID of the parent folder (default: 'root')
 * @returns Created folder metadata or null if creation failed
 */
export async function createFolder(
  folderName: string,
  parentFolderId: string = 'root'
): Promise<drive_v3.Schema$File | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot create folder - Google Drive integration not available');
    return null;
  }
  
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };
    
    const response = await driveClient!.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, mimeType, webViewLink',
    });
    
    return response.data;
  } catch (error) {
    logError(`Error creating folder ${folderName}`, error);
    return null;
  }
}

/**
 * Upload a file to Google Drive
 * 
 * @param filePath - Local path to the file to upload
 * @param options - Upload options
 * @returns Uploaded file metadata or null if upload failed
 */
export async function uploadFile(
  filePath: string,
  options: {
    filename?: string;
    mimeType?: string;
    folderId?: string;
    description?: string;
  } = {}
): Promise<drive_v3.Schema$File | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot upload file - Google Drive integration not available');
    return null;
  }
  
  try {
    const filename = options.filename || path.basename(filePath);
    const folderId = options.folderId || 'root';
    
    // Create file metadata
    const fileMetadata = {
      name: filename,
      parents: [folderId],
      description: options.description,
    };
    
    // Set up media
    const media = {
      mimeType: options.mimeType || 'application/octet-stream',
      body: createReadStream(filePath),
    };
    
    // Upload file
    const response = await driveClient!.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink',
    });
    
    return response.data;
  } catch (error) {
    logError(`Error uploading file ${filePath}`, error);
    return null;
  }
}

/**
 * Upload file content directly (without reading from disk)
 * 
 * @param content - File content as a string
 * @param options - Upload options
 * @returns Uploaded file metadata or null if upload failed
 */
export async function uploadFileContent(
  content: string,
  options: {
    filename: string;
    mimeType?: string;
    folderId?: string;
    description?: string;
  }
): Promise<drive_v3.Schema$File | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot upload file content - Google Drive integration not available');
    return null;
  }
  
  if (!options.filename) {
    logError('Cannot upload file content - filename is required');
    return null;
  }
  
  try {
    const folderId = options.folderId || 'root';
    
    // Create file metadata
    const fileMetadata = {
      name: options.filename,
      parents: [folderId],
      description: options.description,
    };
    
    // Set up media
    const media = {
      mimeType: options.mimeType || 'text/plain',
      body: content,
    };
    
    // Upload file
    const response = await driveClient!.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink',
    });
    
    return response.data;
  } catch (error) {
    logError(`Error uploading file content for ${options.filename}`, error);
    return null;
  }
}

/**
 * Download a file from Google Drive
 * 
 * @param fileId - ID of the file to download
 * @returns File content as a string or null if download failed
 */
export async function downloadFile(fileId: string): Promise<string | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot download file - Google Drive integration not available');
    return null;
  }
  
  try {
    const response = await driveClient!.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });
    
    // Convert buffer to string
    const buffer = Buffer.from(response.data as any);
    return buffer.toString('utf8');
  } catch (error) {
    logError(`Error downloading file ${fileId}`, error);
    return null;
  }
}

/**
 * Share a file with a specific user
 * 
 * @param fileId - ID of the file to share
 * @param email - Email address of the user to share with
 * @param role - Role to grant (reader, writer, commenter)
 * @returns Whether sharing was successful
 */
export async function shareFile(
  fileId: string,
  email: string,
  role: 'reader' | 'writer' | 'commenter' = 'reader'
): Promise<boolean> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot share file - Google Drive integration not available');
    return false;
  }
  
  try {
    const permission = {
      type: 'user',
      role: role,
      emailAddress: email,
    };
    
    await driveClient!.permissions.create({
      fileId: fileId,
      requestBody: permission,
      sendNotificationEmail: true,
    });
    
    return true;
  } catch (error) {
    logError(`Error sharing file ${fileId} with ${email}`, error);
    return false;
  }
}

/**
 * Delete a file from Google Drive
 * 
 * @param fileId - ID of the file to delete
 * @returns Whether deletion was successful
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot delete file - Google Drive integration not available');
    return false;
  }
  
  try {
    await driveClient!.files.delete({
      fileId: fileId,
    });
    
    return true;
  } catch (error) {
    logError(`Error deleting file ${fileId}`, error);
    return false;
  }
}

/**
 * Create a document in Google Drive with content
 * 
 * @param title - Title of the document
 * @param content - Content of the document
 * @param folderId - ID of the folder to create the document in (default: 'root')
 * @returns Created document metadata or null if creation failed
 */
export async function createDocument(
  title: string,
  content: string,
  folderId: string = 'root'
): Promise<drive_v3.Schema$File | null> {
  if (!isGoogleDriveAvailable()) {
    logError('Cannot create document - Google Drive integration not available');
    return null;
  }
  
  try {
    // First create an empty Google Doc
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    };
    
    const response = await driveClient!.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, mimeType, webViewLink',
    });
    
    const documentId = response.data.id;
    
    if (!documentId) {
      logError('Failed to create document - no document ID returned');
      return null;
    }
    
    // Now we have a document ID, we can update its content
    // This is a simplification - in a real implementation you would use the Google Docs API
    // to properly format the document
    
    return response.data;
  } catch (error) {
    logError(`Error creating document ${title}`, error);
    return null;
  }
}

// Helper for debugging issues with Google Drive
function logWarn(message: string, data?: any): void {
  const logMessage = `[WARN] ${message}`;
  console.warn(logMessage);
  if (data) {
    console.warn('Data:', data);
  }
}