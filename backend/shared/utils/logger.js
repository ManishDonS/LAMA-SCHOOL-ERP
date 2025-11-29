/**
 * Logger utility for structured logging across all services
 * Provides consistent logging format with timestamps, levels, and context
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // In production, you might want to send this to a logging service
    // like Winston, Bunyan, or a cloud logging service
    return JSON.stringify(logEntry);
  }

  error(message, error = null, context = {}) {
    const logContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    };
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, logContext));
  }

  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, context));
    }
  }

  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage(LOG_LEVELS.INFO, message, context));
    }
  }

  debug(message, context = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, context));
    }
  }

  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel.toLowerCase());
    const requestedLevelIndex = levels.indexOf(level.toLowerCase());
    return requestedLevelIndex <= currentLevelIndex;
  }

  // HTTP request logger middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const context = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userId: req.user?.userId,
          schoolId: req.schoolId,
        };

        if (res.statusCode >= 500) {
          this.error('HTTP Request Error', null, context);
        } else if (res.statusCode >= 400) {
          this.warn('HTTP Request Warning', context);
        } else {
          this.info('HTTP Request', context);
        }
      });

      next();
    };
  }

  // Database query logger
  logQuery(query, params, duration) {
    this.debug('Database Query', {
      query,
      params,
      duration: `${duration}ms`,
    });
  }

  // Authentication event logger
  logAuth(event, userId, success, details = {}) {
    const level = success ? 'info' : 'warn';
    const message = `Authentication ${event}: ${success ? 'Success' : 'Failed'}`;

    this[level](message, {
      event,
      userId,
      success,
      ...details,
    });
  }
}

// Create logger instances for each service
const createLogger = (serviceName) => new Logger(serviceName);

module.exports = {
  Logger,
  createLogger,
  LOG_LEVELS,
};
