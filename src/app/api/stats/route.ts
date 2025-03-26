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
  
  return { startDate, endDate };
}

// Function to analyze log files and generate statistics
async function generateStats(timeRange: string) {
  const logsDir = path.join(process.cwd(), 'logs');
  const { startDate, endDate } = getDateRange(timeRange);
  
  try {
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
    
    // Initialize statistics
    let totalRequests = 0;
    let totalErrors = 0;
    let responseTimesSum = 0;
    let responseTimesCount = 0;
    
    // Initialize data for charts
    const requestData: { name: string; requests: number; errors: number }[] = [];
    const hourlyData: { hour: string; requests: number }[] = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      requests: 0
    }));
    
    // Model usage tracking
    const modelUsage: Record<string, number> = {};
    
    // Process request logs
    for (const file of requestLogFiles) {
      const filePath = path.join(logsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse log entries
      const lines = content.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          
          // Count total requests
          if (log.message === 'Incoming Request') {
            totalRequests++;
            
            // Track hourly distribution
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();
            hourlyData[hour].requests++;
            
            // Track model usage if available
            const model = log.body?.model;
            if (model) {
              modelUsage[model] = (modelUsage[model] || 0) + 1;
            }
          }
          
          // Track response times
          if (log.message === 'Outgoing Response' && log.responseTime) {
            responseTimesSum += log.responseTime;
            responseTimesCount++;
          }
          
          // Group by day for the request data chart
          if (log.timestamp) {
            const date = new Date(log.timestamp);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Find or create the day entry
            let dayEntry = requestData.find(d => d.name === dayName);
            if (!dayEntry) {
              dayEntry = { name: dayName, requests: 0, errors: 0 };
              requestData.push(dayEntry);
            }
            
            // Increment the request count for this day
            if (log.message === 'Incoming Request') {
              dayEntry.requests++;
            }
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
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse log entries
      const lines = content.split('\n').filter(Boolean);
      totalErrors += lines.length;
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          
          // Group by day for the error data chart
          if (log.timestamp) {
            const date = new Date(log.timestamp);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Find or create the day entry
            let dayEntry = requestData.find(d => d.name === dayName);
            if (!dayEntry) {
              dayEntry = { name: dayName, requests: 0, errors: 0 };
              requestData.push(dayEntry);
            }
            
            // Increment the error count for this day
            dayEntry.errors++;
          }
        } catch (e) {
          // Skip invalid log entries
          continue;
        }
      }
    }
    
    // Sort request data by day of week
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    requestData.sort((a, b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name));
    
    // Get API keys for key usage statistics
    const keys = await ApiKey.findAll({});
    const keyUsageData = keys.map(key => ({
      name: `Key ${key._id.substring(0, 4)}...`,
      value: key.requestCount || 0
    }));
    
    // Convert model usage to chart data format
    const modelUsageData = Object.entries(modelUsage).map(([name, value]) => ({
      name,
      value
    }));
    
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
    // If logs directory doesn't exist yet, return empty stats
    if (error.code === 'ENOENT') {
      return {
        totalRequests: 0,
        totalErrors: 0,
        successRate: 100,
        avgResponseTime: 0,
        requestData: [],
        hourlyData: Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}:00`, requests: 0 })),
        keyUsageData: [],
        modelUsageData: []
      };
    }
    throw error;
  }
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