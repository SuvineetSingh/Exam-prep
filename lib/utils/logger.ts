type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private readonly isDev = process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDev) return;
    const method = level === 'debug' ? 'log' : level;
    console[method](`[${level.toUpperCase()}]`, message, context ?? '');
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context); }
  info(message: string, context?: LogContext)  { this.log('info',  message, context); }
  warn(message: string, context?: LogContext)  { this.log('warn',  message, context); }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
