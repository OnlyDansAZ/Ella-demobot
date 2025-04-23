/**
 * Integration Manager
 * 
 * Central hub for managing and accessing all external service integrations.
 * This module initializes and coordinates access to various integrated services
 * like Slack, Google Calendar, and document management systems.
 */

import { logInfo, logError, createModuleLogger } from '../utils/logger';
import { initializeSlackIntegration, isSlackIntegrationAvailable } from './slack';
import { initializeGoogleCalendar, isGoogleCalendarAvailable } from './googleCalendar';
import { initializeGoogleDrive, isGoogleDriveAvailable } from './googleDrive';

// Create a logger for the integration manager
const logger = createModuleLogger('IntegrationManager');

// Integration status tracking
interface IntegrationStatus {
  name: string;
  available: boolean;
  initialized: boolean;
  lastError?: string;
  lastInitAttempt?: Date;
}

// Track the status of each integration
const integrationStatus: Record<string, IntegrationStatus> = {
  slack: {
    name: 'Slack',
    available: false,
    initialized: false
  },
  googleCalendar: {
    name: 'Google Calendar',
    available: false,
    initialized: false
  },
  googleDrive: {
    name: 'Google Drive',
    available: false,
    initialized: false
  }
};

/**
 * Initialize all integrations
 * 
 * @returns Object with initialization results for each integration
 */
export async function initializeAllIntegrations(): Promise<Record<string, boolean>> {
  logger.info('Initializing all external service integrations');
  
  const results: Record<string, boolean> = {};
  
  // Initialize Slack
  try {
    logger.info('Initializing Slack integration');
    integrationStatus.slack.lastInitAttempt = new Date();
    results.slack = await initializeSlackAsync();
    integrationStatus.slack.initialized = results.slack;
    integrationStatus.slack.available = isSlackIntegrationAvailable();
  } catch (error) {
    logger.error('Failed to initialize Slack integration', error);
    results.slack = false;
    integrationStatus.slack.lastError = error instanceof Error ? error.message : String(error);
  }
  
  // Initialize Google Calendar
  try {
    logger.info('Initializing Google Calendar integration');
    integrationStatus.googleCalendar.lastInitAttempt = new Date();
    results.googleCalendar = await initializeGoogleCalendarAsync();
    integrationStatus.googleCalendar.initialized = results.googleCalendar;
    integrationStatus.googleCalendar.available = isGoogleCalendarAvailable();
  } catch (error) {
    logger.error('Failed to initialize Google Calendar integration', error);
    results.googleCalendar = false;
    integrationStatus.googleCalendar.lastError = error instanceof Error ? error.message : String(error);
  }
  
  // Initialize Google Drive
  try {
    logger.info('Initializing Google Drive integration');
    integrationStatus.googleDrive.lastInitAttempt = new Date();
    results.googleDrive = await initializeGoogleDriveAsync();
    integrationStatus.googleDrive.initialized = results.googleDrive;
    integrationStatus.googleDrive.available = isGoogleDriveAvailable();
  } catch (error) {
    logger.error('Failed to initialize Google Drive integration', error);
    results.googleDrive = false;
    integrationStatus.googleDrive.lastError = error instanceof Error ? error.message : String(error);
  }
  
  // Log summary of initialization results
  const availableIntegrations = Object.entries(integrationStatus)
    .filter(([_, status]) => status.available)
    .map(([_, status]) => status.name);
  
  if (availableIntegrations.length > 0) {
    logger.info(`Successfully initialized integrations: ${availableIntegrations.join(', ')}`);
  } else {
    logger.warn('No integrations were successfully initialized');
  }
  
  return results;
}

/**
 * Get the current status of all integrations
 */
export function getIntegrationStatus(): Record<string, IntegrationStatus> {
  // Update availability status in case it changed since initialization
  integrationStatus.slack.available = isSlackIntegrationAvailable();
  integrationStatus.googleCalendar.available = isGoogleCalendarAvailable();
  integrationStatus.googleDrive.available = isGoogleDriveAvailable();
  
  return { ...integrationStatus };
}

/**
 * Check if a specific integration is available
 * 
 * @param integrationName - Name of the integration to check
 * @returns Whether the integration is available
 */
export function isIntegrationAvailable(integrationName: 'slack' | 'googleCalendar' | 'googleDrive'): boolean {
  switch (integrationName) {
    case 'slack':
      return isSlackIntegrationAvailable();
    case 'googleCalendar':
      return isGoogleCalendarAvailable();
    case 'googleDrive':
      return isGoogleDriveAvailable();
    default:
      return false;
  }
}

/**
 * Generate authorization URLs for all integrations that require user authentication
 */
export function generateAuthUrls(): Record<string, string | null> {
  const authUrls: Record<string, string | null> = {};
  
  // For Google integrations, we can use the same auth URL for both since they share the same OAuth client
  // This is just a placeholder - in practice, you'd want to handle each service separately
  authUrls.googleServices = null;
  
  return authUrls;
}

// Helper function to wrap initialization in a Promise
async function initializeSlackAsync(): Promise<boolean> {
  return Promise.resolve(initializeSlackIntegration());
}

// Helper function to wrap Google Calendar initialization in a Promise
async function initializeGoogleCalendarAsync(): Promise<boolean> {
  return initializeGoogleCalendar();
}

// Helper function to wrap Google Drive initialization in a Promise
async function initializeGoogleDriveAsync(): Promise<boolean> {
  return initializeGoogleDrive();
}

// Export integrations for direct access when needed
export * as slack from './slack';
export * as googleCalendar from './googleCalendar';
export * as googleDrive from './googleDrive';