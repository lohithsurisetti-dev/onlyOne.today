/**
 * Production-safe logging utility
 * Automatically disabled in production unless explicitly enabled
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ENABLE_PROD_LOGGING = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true
    
    // In production, only log if explicitly enabled
    if (IS_PRODUCTION && !ENABLE_PROD_LOGGING) return false
    
    // In development, log everything
    return true
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level]

    let formatted = `${emoji} [${timestamp}] ${message}`
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`
    }

    return formatted
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error instanceof Error && {
          error: error.message,
          stack: error.stack,
        }),
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  /**
   * API-specific logging
   */
  api(method: string, path: string, status: number, duration?: number): void {
    const message = `${method} ${path} ${status}`
    const context = duration ? { duration: `${duration}ms` } : undefined
    
    if (status >= 500) {
      this.error(message, undefined, context)
    } else if (status >= 400) {
      this.warn(message, context)
    } else {
      this.info(message, context)
    }
  }

  /**
   * Performance logging
   */
  perf(label: string, startTime: number): void {
    const duration = performance.now() - startTime
    this.debug(`⏱️ ${label}`, { duration: `${duration.toFixed(2)}ms` })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error | unknown, ctx?: LogContext) => logger.error(msg, err, ctx),
  api: (method: string, path: string, status: number, duration?: number) => 
    logger.api(method, path, status, duration),
  perf: (label: string, startTime: number) => logger.perf(label, startTime),
}

export default logger

