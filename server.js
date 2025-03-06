import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import keyManager from './services/KeyManager.js';
import { requestLoggingMiddleware, logError } from './services/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(requestLoggingMiddleware);

// Create logs directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, 'logs');
import { mkdir } from 'fs/promises';
try {
  await mkdir(logsDir, { recursive: true });
} catch (error) {
  console.error('Error creating logs directory:', error);
}

// Initialize with default key if provided
const initializeKeys = async () => {
  try {
    const defaultKey = process.env.GEMINI_API_KEYS;
    if (defaultKey) {
      await keyManager.addKey(defaultKey);
    }
    await keyManager.initialize();
  } catch (error) {
    logError(error, { context: 'Key initialization' });
  }
};

initializeKeys().catch(error => logError(error, { context: 'initializeKeys' }));

// Admin endpoint to add new API keys
app.post('/admin/keys', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'API key is required' });
    }
    await keyManager.addKey(key);
    res.json({ message: 'API key added successfully' });
  } catch (error) {
    logError(error, { context: 'Admin API key addition' });
    res.status(500).json({ error: error.message });
  }
});

// Helper function to handle streaming response
async function handleStreamingResponse(axiosResponse, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for await (const chunk of axiosResponse.data) {
    res.write(chunk);
  }
  res.end();
}

// Google Gemini proxy endpoint
app.post('/v1/chat/completions', async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;
  const isStreaming = req.body?.stream === true;

  while (retryCount < maxRetries) {
    try {
      // Get the current key or rotate if needed
      const currentKey = await keyManager.getKey();
      
      const axiosConfig = {
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
        req.body,
        axiosConfig
      );

      // Mark the successful use of the key
      await keyManager.markKeySuccess();

      // Handle streaming response differently
      if (isStreaming) {
        return handleStreamingResponse(response, res);
      }

      return res.json(response.data);
    } catch (error) {
      const isRateLimit = await keyManager.markKeyError(error);

      // Handle streaming errors by ending the response
      if (isStreaming && res.writableEnded === false) {
        res.write(`data: ${JSON.stringify({
          error: {
            message: error.message,
            type: 'stream_error'
          }
        })}\n\n`);
        res.end();
        return;
      }

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
      if (!isStreaming) {
        return res.status(error.response?.status || 500).json({
          error: {
            message: error.response?.data?.error?.message || error.message,
            type: error.response?.data?.error?.type || 'internal_error'
          }
        });
      }
    }
  }
});

// Models endpoint
app.get('/v1/models', async (req, res) => {
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
      return res.json(response.data);
    } catch (error) {
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

      return res.status(error.response?.status || 500).json({
        error: {
          message: error.response?.data?.error?.message || error.message,
          type: error.response?.data?.error?.type || 'internal_error'
        }
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logError(err, { 
    context: 'Global error handler',
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'internal_error'
    }
  });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Google Gemini Proxy Server running on port ${PORT}`);
});