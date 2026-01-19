/**
 * Centralized logging utility
 * Provides structured logging with different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // Console output in development
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${timestamp}] [${level.toUpperCase()}]`,
        message,
        context || ''
      );
    }

    // Send to monitoring service in production
    if (!this.isDevelopment) {
      this.sendToMonitoring(logData);
    }
  }

  private sendToMonitoring(_logData: any) {
    // TODO: Implement your monitoring service
    // Examples:
    // - Sentry.captureMessage()
    // - DataDog.log()
    // - Custom API endpoint
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
