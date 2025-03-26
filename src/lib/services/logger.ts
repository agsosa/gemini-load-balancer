import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { sanitizeRequest } from '../utils/sanitize';
import { mkdir } from 'fs/promises';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
async function ensureLogsDir() {
  try {
    await mkdir(logsDir, { recursive: true });
  } catch (error) {
    // Directory already exists or other error
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      console.error('Error creating logs directory:', error);
    }
  }
}

// Call this function immediately
ensureLogsDir().catch(console.error);

// Configure transport for requests
const requestTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'requests-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Configure transport for errors
const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'errors-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Configure transport for key management
const keyTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'keys-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Create loggers
export const requestLogger = winston.createLogger({
  transports: [
    requestTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const errorLogger = winston.createLogger({
  transports: [
    errorTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const keyLogger = winston.createLogger({
  transports: [
    keyTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Helper function to log streaming chunks
export const logStreamChunk = (requestId: string, chunk: Buffer) => {
  try {
    const data = chunk.toString();
    requestLogger.info('Stream Chunk', {
      requestId,
      data: data.trim()
    });
  } catch (error) {
    logError(error, { context: 'Stream chunk logging', requestId });
  }
};

// Helper function to log key management events
export const logKeyEvent = (event: string, details: any) => {
  keyLogger.info(event, details);
};

// Helper function to log errors
export const logError = (error: any, context: any = {}) => {
  errorLogger.error(error.message || 'Unknown error', {
    stack: error.stack,
    ...context
  });
};

// Function to get logs
export const getLogs = async (type: 'requests' | 'errors' | 'keys', options: {
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
} = {}) => {
  const { limit = 100, startDate, endDate, search } = options;
  
  // This is a placeholder. In a real implementation, you would read from the log files
  // and filter based on the options.
  return {
    logs: [],
    total: 0
  };
};