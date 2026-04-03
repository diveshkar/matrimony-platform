interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(level: LogLevel, message: string, context?: LogContext, data?: unknown) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(data !== undefined ? { data } : {}),
  };
  return JSON.stringify(entry);
}

export function createLogger(defaultContext?: LogContext) {
  return {
    info(message: string, data?: unknown, context?: LogContext) {
      const output = formatLog('info', message, { ...defaultContext, ...context }, data);
      process.stdout.write(output + '\n');
    },

    warn(message: string, data?: unknown, context?: LogContext) {
      const output = formatLog('warn', message, { ...defaultContext, ...context }, data);
      process.stdout.write(output + '\n');
    },

    error(message: string, data?: unknown, context?: LogContext) {
      const output = formatLog('error', message, { ...defaultContext, ...context }, data);
      process.stderr.write(output + '\n');
    },

    debug(message: string, data?: unknown, context?: LogContext) {
      if (process.env.LOG_LEVEL === 'debug') {
        const output = formatLog('debug', message, { ...defaultContext, ...context }, data);
        process.stdout.write(output + '\n');
      }
    },

    child(context: LogContext) {
      return createLogger({ ...defaultContext, ...context });
    },
  };
}

export const logger = createLogger({ service: 'matrimony' });
