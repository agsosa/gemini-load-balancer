import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { sanitizeRequest } from '../utils/sanitize';
import { mkdir, readdir, readFile, stat } from 'fs/promises';

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
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  search?: string;
} = {}) => {
  const { limit = 100, startDate, endDate, search } = options;
  const logPrefix = `${type}-`;
  const logEntries: any[] = [];

  try {
    const files = await readdir(logsDir);

    // Filter files by prefix and date range
    const logFiles = files
      .filter(file => file.startsWith(logPrefix) && file.endsWith('.log'))
      .map(file => {
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})\.log$/);
        return { name: file, date: dateMatch ? dateMatch[1] : null };
      })
      .filter(file => {
        if (!file.date) return false;
        if (startDate && file.date < startDate) return false;
        if (endDate && file.date > endDate) return false;
        return true;
      })
      .sort((a, b) => b.date!.localeCompare(a.date!)); // Sort newest first

    // Read files and collect log entries
    for (const fileInfo of logFiles) {
      if (logEntries.length >= limit) break;

      const filePath = path.join(logsDir, fileInfo.name);
      try {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        // Read lines in reverse (newest first)
        for (let i = lines.length - 1; i >= 0; i--) {
          if (logEntries.length >= limit) break;
          const line = lines[i];
          if (!line) continue;

          try {
            const logEntry = JSON.parse(line);

            // Apply search filter
            if (search) {
              const searchableString = JSON.stringify(logEntry).toLowerCase();
              if (!searchableString.includes(search.toLowerCase())) {
                continue;
              }
            }

            logEntries.unshift(logEntry); // Add to beginning to maintain order
          } catch (parseError) {
            // Ignore lines that are not valid JSON
            console.warn(`Skipping invalid log line in ${fileInfo.name}: ${line}`);
          }
        }
      } catch (readError) {
        console.error(`Error reading log file ${fileInfo.name}:`, readError);
      }
    }

    // Return the collected logs (up to the limit)
    // Note: 'total' here is just the count returned, not the total matching logs across all files.
    // A more robust solution might involve pagination or streaming.
    return {
      logs: logEntries,
      total: logEntries.length
    };

  } catch (error) {
    console.error('Error accessing logs directory:', error);
    logError(error, { context: 'getLogs function' });
    return {
      logs: [],
      total: 0
    };
  }
};