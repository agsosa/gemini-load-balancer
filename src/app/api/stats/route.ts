import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ApiKey } from '@/lib/models/ApiKey';
import { logError } from '@/lib/services/logger';

// Function to parse date from log filename
function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  return new Date(match[0]);
}

// Function to get date range based on timeRange parameter
function getDateRange(timeRange: string): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7); // Default to 7 days
  }
  
  // Set time to start of day for startDate and end of day for endDate
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

// Format date for display in charts
function formatDate(date: Date, timeRange: string): string {
  if (timeRange === '24h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit' });
  } else if (timeRange === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Generate time periods for chart based on timeRange
function generateTimePeriods(startDate: Date, endDate: Date, timeRange: string): Date[] {
  const periods: Date[] = [];
  let current = new Date(startDate);
  
  while (current <= endDate) {
    periods.push(new Date(current));
    
    if (timeRange === '24h') {
      current.setHours(current.getHours() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }
  
  return periods;
}

// Function to analyze log files and generate statistics
async function generateStats(timeRange: string) {
  const logsDir = path.join(process.cwd(), 'logs');
  const { startDate, endDate } = getDateRange(timeRange);
  
  try {
    // Check if logs directory exists
    try {
      await fs.access(logsDir);
    } catch (error) {
      // If logs directory doesn't exist, return empty stats
      return createEmptyStats(startDate, endDate, timeRange);
    }
    
    // Get all log files
    const files = await fs.readdir(logsDir);
    
    // Filter request log files within the date range
    const requestLogFiles = files
      .filter(file => file.startsWith('requests-'))
      .filter(file => {
        const fileDate = parseDateFromFilename(file);
        return fileDate && fileDate >= startDate && fileDate <= endDate;
      });
    
    // Filter error log files within the date range
    const errorLogFiles = files
      .filter(file => file.startsWith('errors-'))
      .filter(file => {
        const fileDate = parseDateFromFilename(file);
        return fileDate && fileDate >= startDate && fileDate <= endDate;
      });

    // Filter key log files within the date range
    const keyLogFiles = files
      .filter(file => file.startsWith('keys-'))
      .filter(file => {
        const fileDate = parseDateFromFilename(file);
        return fileDate && fileDate >= startDate && fileDate <= endDate;
      });
    
    // Initialize statistics
    let totalRequests = 0;
    let totalErrors = 0;
    let responseTimesSum = 0;
    let responseTimesCount = 0;
    
    // Generate time periods for charts
    const timePeriods = generateTimePeriods(startDate, endDate, timeRange);
    
    // Initialize request data with all time periods
    const requestDataMap = new Map<string, { name: string, requests: number, errors: number, date: Date }>();
    timePeriods.forEach(date => {
      const name = formatDate(date, timeRange);
      requestDataMap.set(name, { name, requests: 0, errors: 0, date });
    });
    
    // Initialize hourly data
    const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      requests: 0
    }));
    
    // Model usage tracking
    const modelUsage: Record<string, number> = {};
    
    // Key usage tracking with timestamps
    const keyUsage: Record<string, { count: number, lastUsed: Date | null }> = {};
    
    // Process request logs
    for (const file of requestLogFiles) {
      const filePath = path.join(logsDir, file);
      let content = '';
      
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading log file ${file}:`, error);
        continue;
      }
      
      // Parse log entries
      const lines = content.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          const timestamp = new Date(log.timestamp);
          
          // Skip entries outside the date range
          if (timestamp < startDate || timestamp > endDate) {
            continue;
          }
          
          // Count requests - more flexible parsing that doesn't rely on specific message format
          totalRequests++;
          
          // Track hourly distribution
          const hour = timestamp.getHours();
          hourlyData[hour].requests++;
          
          // Track model usage if available - check for model in various possible locations in log structure
          let model = 'unknown';
          if (log.body?.model) {
            model = log.body.model;
          } else if (log.model) {
            model = log.model;
          } else if (log.data?.model) {
            model = log.data.model;
          }
          modelUsage[model] = (modelUsage[model] || 0) + 1;
          
          // Track API key usage if available
          if (log.apiKey) {
            if (!keyUsage[log.apiKey]) {
              keyUsage[log.apiKey] = { count: 0, lastUsed: null };
            }
            keyUsage[log.apiKey].count++;
            keyUsage[log.apiKey].lastUsed = timestamp;
          }
          
          // Group by formatted date for the request data chart
          const formattedDate = formatDate(timestamp, timeRange);
          const entry = requestDataMap.get(formattedDate);
          if (entry) {
            entry.requests++;
          }
          
          // Track response times
          if (log.message === 'Outgoing Response' && log.responseTime) {
            responseTimesSum += log.responseTime;
            responseTimesCount++;
          }
        } catch (e) {
          // Skip invalid log entries
          continue;
        }
      }
    }
    
    // Process error logs
    for (const file of errorLogFiles) {
      const filePath = path.join(logsDir, file);
      let content = '';
      
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading log file ${file}:`, error);
        continue;
      }
      
      // Parse log entries
      const lines = content.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          const timestamp = new Date(log.timestamp);
          
          // Skip entries outside the date range
          if (timestamp < startDate || timestamp > endDate) {
            continue;
          }
          
          totalErrors++;
          
          // Group by formatted date for the error data chart
          const formattedDate = formatDate(timestamp, timeRange);
          const entry = requestDataMap.get(formattedDate);
          if (entry) {
            entry.errors++;
          }
        } catch (e) {
          // Count as error but skip invalid log entries for chart
          totalErrors++;
          continue;
        }
      }
    }
    
    // Process key logs for more accurate key usage data
    for (const file of keyLogFiles) {
      const filePath = path.join(logsDir, file);
      let content = '';
      
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading log file ${file}:`, error);
        continue;
      }
      
      // Parse log entries
      const lines = content.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          const timestamp = new Date(log.timestamp);
          
          // Skip entries outside the date range
          if (timestamp < startDate || timestamp > endDate) {
            continue;
          }
          
          // Track API key usage from key logs
          if (log.key && log.action) {
            if (!keyUsage[log.key]) {
              keyUsage[log.key] = { count: 0, lastUsed: null };
            }
            
            if (log.action === 'used') {
              keyUsage[log.key].count++;
              keyUsage[log.key].lastUsed = timestamp;
            }
          }
        } catch (e) {
          // Skip invalid log entries
          continue;
        }
      }
    }

    // Convert request data map to array and sort by date
    const requestData = Array.from(requestDataMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ name, requests, errors }) => ({ name, requests, errors }));

    // Get API keys for key usage statistics
    const keys = await ApiKey.findAll({});
    
    // Prepare key usage data for chart
    let keyUsageData = [];
    for (const key of keys) {
      const usage = keyUsage[key.key] || { count: 0 };
      const maskedKey = `Key ${key._id.substring(0, 4)}...`;
      
      // Only include keys that have been used in the selected time range
      if (usage.count > 0) {
        keyUsageData.push({
          name: maskedKey,
          value: usage.count
        });
      }
    }
    
    // If no key usage data from logs, fall back to stored request counts
    if (keyUsageData.length === 0) {
      keyUsageData = keys.map(key => ({
        name: `Key ${key._id.substring(0, 4)}...`,
        value: key.requestCount || 0
      })).filter(item => item.value > 0);
    }
    
    // Convert model usage to chart data format and sort by usage
    const modelUsageData = Object.entries(modelUsage)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate success rate and average response time
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
    const avgResponseTime = responseTimesCount > 0 ? Math.round(responseTimesSum / responseTimesCount) : 0;
    
    return {
      totalRequests,
      totalErrors,
      successRate,
      avgResponseTime,
      requestData,
      hourlyData,
      keyUsageData,
      modelUsageData
    };
  } catch (error: any) {
    console.error('Error generating stats:', error);
    // If logs directory doesn't exist yet, return empty stats
    return createEmptyStats(startDate, endDate, timeRange);
  }
}

// Create empty stats object with proper time periods
function createEmptyStats(startDate: Date, endDate: Date, timeRange: string) {
  const timePeriods = generateTimePeriods(startDate, endDate, timeRange);
  const requestData = timePeriods.map(date => ({
    name: formatDate(date, timeRange),
    requests: 0,
    errors: 0
  }));
  
  return {
    totalRequests: 0,
    totalErrors: 0,
    successRate: 100,
    avgResponseTime: 0,
    requestData,
    hourlyData: Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}:00`, requests: 0 })),
    keyUsageData: [],
    modelUsageData: []
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    
    const stats = await generateStats(timeRange);
    
    return NextResponse.json(stats);
  } catch (error: any) {
    logError(error, { context: 'Stats API' });
    
    return NextResponse.json(
      {
        error: {
          message: error.message || 'Failed to generate statistics',
          type: 'internal_error'
        }
      },
      { status: 500 }
    );
  }
}