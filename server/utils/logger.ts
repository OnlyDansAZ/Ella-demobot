/**
 * Logger utility for centralized logging with consistent formatting
 * Used across the application to provide informative and structured logs
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Format a log message with timestamp, level, and optional error details
 */
function formatLogMessage(
  level: LogLevel, 
  message: string, 
  error?: any
): string {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (error) {
    // Extract error message and stack if available
    const errorMessage = error.message || String(error);
    const errorStack = error.stack ? `\n${error.stack}` : '';
    formattedMessage += `\nError: ${errorMessage}${errorStack}`;
  }
  
  return formattedMessage;
}

/**
 * Log a debug message
 */
export function logDebug(message: string, data?: any): void {
  // Only log debug in development environment
  if (process.env.NODE_ENV === 'development') {
    const logMessage = formatLogMessage(LogLevel.DEBUG, message);
    console.debug(logMessage);
    if (data) {
      console.debug('Data:', data);
    }
  }
}

/**
 * Log an informational message
 */
export function logInfo(message: string, data?: any): void {
  const logMessage = formatLogMessage(LogLevel.INFO, message);
  console.info(logMessage);
  if (data) {
    console.info('Data:', data);
  }
}

/**
 * Log a warning message
 */
export function logWarn(message: string, data?: any): void {
  const logMessage = formatLogMessage(LogLevel.WARN, message);
  console.warn(logMessage);
  if (data) {
    console.warn('Data:', data);
  }
}

/**
 * Log an error message with optional error object
 */
export function logError(message: string, error?: any): void {
  const logMessage = formatLogMessage(LogLevel.ERROR, message, error);
  console.error(logMessage);
}

/**
 * Log start of a process or operation
 */
export function logStart(process: string): void {
  logInfo(`Starting: ${process}`);
}

/**
 * Log end of a process or operation with duration
 */
export function logEnd(process: string, startTime: number): void {
  const duration = Date.now() - startTime;
  logInfo(`Completed: ${process} (duration: ${duration}ms)`);
}

/**
 * Create a logger for a specific module
 */
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, data?: any) => logDebug(`[${moduleName}] ${message}`, data),
    info: (message: string, data?: any) => logInfo(`[${moduleName}] ${message}`, data),
    warn: (message: string, data?: any) => logWarn(`[${moduleName}] ${message}`, data),
    error: (message: string, error?: any) => logError(`[${moduleName}] ${message}`, error),
    startProcess: (process: string) => logStart(`[${moduleName}] ${process}`),
    endProcess: (process: string, startTime: number) => logEnd(`[${moduleName}] ${process}`, startTime)
  };
}