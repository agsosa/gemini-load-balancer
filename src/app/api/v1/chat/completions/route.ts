import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import keyManager from '@/lib/services/keyManager';
import { logError } from '@/lib/services/logger';

// Helper function to handle streaming response
async function handleStreamingResponse(axiosResponse: any, res: any) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of axiosResponse.data) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  const maxRetries = 3;
  let retryCount = 0;
  
  // Parse the request body
  const body = await req.json();
  const isStreaming = body?.stream === true;

  while (retryCount < maxRetries) {
    try {
      // Get the current key or rotate if needed
      const currentKey = await keyManager.getKey();
      
      const axiosConfig: any = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentKey}`,
        }
      };

      // Add responseType: 'stream' for streaming requests
      if (isStreaming) {
        axiosConfig.responseType = 'stream';
      }

      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        body,
        axiosConfig
      );

      // Mark the successful use of the key
      await keyManager.markKeySuccess();

      // Handle streaming response differently
      if (isStreaming) {
        return handleStreamingResponse(response, null);
      }

      return NextResponse.json(response.data);
    } catch (error: any) {
      const isRateLimit = await keyManager.markKeyError(error);

      // Only retry on rate limits or server errors
      if ((isRateLimit || error.response?.status >= 500) && retryCount < maxRetries - 1) {
        retryCount++;
        continue;
      }

      logError(error, { 
        context: 'Chat completions',
        retryCount,
        statusCode: error.response?.status,
        streaming: isStreaming
      });

      // For non-streaming requests, send error response
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