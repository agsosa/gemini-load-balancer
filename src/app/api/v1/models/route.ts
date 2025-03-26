import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import keyManager from '@/lib/services/keyManager';
import { logError } from '@/lib/services/logger';

export async function GET(req: NextRequest) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const currentKey = await keyManager.getKey();
      const axiosConfig = {
        headers: {
          'Authorization': `Bearer ${currentKey}`,
        }
      };

      const response = await axios.get(
        'https://generativelanguage.googleapis.com/v1beta/openai/models',
        axiosConfig
      );

      await keyManager.markKeySuccess();
      return NextResponse.json(response.data);
    } catch (error: any) {
      const isRateLimit = await keyManager.markKeyError(error);

      if ((isRateLimit || error.response?.status >= 500) && retryCount < maxRetries - 1) {
        retryCount++;
        continue;
      }

      logError(error, { 
        context: 'Models endpoint',
        retryCount,
        statusCode: error.response?.status
      });

      return NextResponse.json(
        {
          error: {
            message: error.response?.data?.error?.message || error.message,
            type: error.response?.data?.error?.type || 'internal_error'
          }
        },
        { status: error.response?.status || 500 }
      );
    }
  }

  // This should never be reached, but TypeScript requires a return
  return NextResponse.json(
    {
      error: {
        message: 'Maximum retries exceeded',
        type: 'internal_error'
      }
    },
    { status: 500 }
  );
}