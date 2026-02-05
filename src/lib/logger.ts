// src/lib/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private debugEnabled = process.env.DEBUG === 'true';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return context 
      ? `${prefix} ${message} ${JSON.stringify(context)}`
      : `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev || this.debugEnabled) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(this.formatMessage('error', message, {
      ...context,
      error: errorMessage,
      stack: errorStack,
    }));
  }

  // Convenience method for API routes
  api(method: string, path: string, context?: LogContext): void {
    if (this.isDev || this.debugEnabled) {
      console.log(`🌐 ${method} ${path}`, context || '');
    }
  }

  // Convenience method for AI provider operations
  ai(provider: string, action: string, context?: LogContext): void {
    if (this.isDev || this.debugEnabled) {
      console.log(`🤖 [${provider}] ${action}`, context || '');
    }
  }

  // Convenience method for cache operations
  cache(action: 'hit' | 'miss' | 'set' | 'del', key: string): void {
    if (this.isDev || this.debugEnabled) {
      const emoji = action === 'hit' ? '✅' : action === 'miss' ? '❌' : action === 'set' ? '💾' : '🗑️';
      console.log(`${emoji} Cache ${action}: ${key}`);
    }
  }
}

// Singleton export
export const logger = new Logger();