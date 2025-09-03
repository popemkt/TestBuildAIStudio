/**
 * Logger service for SplitSmart AI application
 * Provides environment-aware logging with different levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface Logger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class LoggerService implements Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    // Safe environment detection that works with TypeScript
    this.isDevelopment =
      (import.meta as any).env?.DEV ||
      (import.meta as any).env?.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  // Convenience methods for common scenarios
  apiError(operation: string, error: Error): void {
    this.error(`API Error in ${operation}:`, error.message, error);
  }

  apiSuccess(operation: string, data?: any): void {
    this.debug(`API Success in ${operation}`, data);
  }

  userAction(action: string, details?: any): void {
    this.debug(`User Action: ${action}`, details);
  }

  performanceStart(operation: string): () => void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return () => {}; // No-op in production
    }

    const startTime = performance.now();
    this.debug(`Performance Start: ${operation}`);

    return () => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      this.debug(`Performance End: ${operation} took ${duration}ms`);
    };
  }
}

// Export singleton instance
export const logger = new LoggerService();

// Export convenience functions for easier migration
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);

export default logger;
