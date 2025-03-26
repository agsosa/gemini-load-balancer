import { ApiKey } from '../models/ApiKey';
import { logKeyEvent, logError } from './logger';

class KeyManager {
  private currentKey: ApiKey | null = null;
  private rotationRequestCount: number;
  private requestCounter: number = 0;

  constructor() {
    // Default to 5 requests before rotation
    this.rotationRequestCount = parseInt(process.env.KEY_ROTATION_REQUEST_COUNT || '5');
  }

  async initialize() {
    if (!this.currentKey) {
      await this.rotateKey();
    }
  }

  async rotateKey(): Promise<string> {
    try {
      // Get a working key that's not in cooldown
      const keys = await ApiKey.findAll({
        isActive: true,
        $or: [
          { rateLimitResetAt: null },
          { rateLimitResetAt: { $lte: new Date().toISOString() } }
        ]
      });

      // Sort by lastUsed ascending (oldest first)
      const sortedKeys = keys.sort((a, b) => {
        if (!a.lastUsed) return -1;
        if (!b.lastUsed) return 1;
        return new Date(a.lastUsed).getTime() - new Date(b.lastUsed).getTime();
      });

      const key = sortedKeys[0];

      if (!key) {
        const error = new Error('No available API keys');
        logError(error, { context: 'Key rotation' });
        throw error;
      }

      this.currentKey = key;
      this.requestCounter = 0; // Reset counter on key rotation
      
      // Log key rotation
      logKeyEvent('Key Rotation', {
        keyId: key._id,
        lastUsed: key.lastUsed,
        failureCount: key.failureCount,
        rotationType: 'scheduled'
      });

      return key.key;
    } catch (error: any) {
      logError(error, { action: 'rotateKey' });
      throw error;
    }
  }

  async markKeySuccess() {
    if (this.currentKey) {
      try {
        this.currentKey.lastUsed = new Date().toISOString();
        this.currentKey.requestCount += 1; // Increment request count on success
        await this.currentKey.save();
        
        logKeyEvent('Key Success', {
          keyId: this.currentKey._id,
          lastUsed: this.currentKey.lastUsed,
          requestCount: this.currentKey.requestCount
        });
      } catch (error: any) {
        logError(error, { action: 'markKeySuccess' });
      }
    }
  }

  async markKeyError(error: any): Promise<boolean> {
    if (!this.currentKey) return false;

    try {
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        this.currentKey.rateLimitResetAt = resetTime 
          ? new Date(resetTime * 1000).toISOString() 
          : new Date(Date.now() + 60000).toISOString();
        
        logKeyEvent('Rate Limit Hit', {
          keyId: this.currentKey._id,
          resetTime: this.currentKey.rateLimitResetAt
        });

        await this.currentKey.save();
        // Clear current key to force rotation
        this.currentKey = null;
        return true; // Indicate it was a rate limit error
      }

      this.currentKey.failureCount += 1;
      
      // If too many failures, deactivate the key
      if (this.currentKey.failureCount >= 5) {
        this.currentKey.isActive = false;
        logKeyEvent('Key Deactivated', {
          keyId: this.currentKey._id,
          reason: 'Too many failures',
          failureCount: this.currentKey.failureCount
        });
        // Clear current key to force rotation
        this.currentKey = null;
      }

      // Fix the null check here
      if (this.currentKey) {
        await this.currentKey.save();
      }
      
      return false; // Indicate it was not a rate limit error
    } catch (error: any) {
      logError(error, { 
        action: 'markKeyError',
        keyId: this.currentKey?._id
      });
      return false;
    }
  }

  async getKey(): Promise<string> {
    try {
      // If we have a current key and it's not in cooldown, keep using it
      if (this.currentKey) {
        const now = new Date();
        if (!this.currentKey.rateLimitResetAt || 
            new Date(this.currentKey.rateLimitResetAt) <= now) {
          
          // Check if request count rotation is enabled and if threshold is reached
          if (this.rotationRequestCount > 0 && 
              this.requestCounter >= this.rotationRequestCount) {
            
            logKeyEvent('Request Count Rotation Triggered', { 
              keyId: this.currentKey._id, 
              requestCount: this.currentKey.requestCount, 
              rotationRequestCount: this.rotationRequestCount 
            });
            
            return await this.rotateKey(); // Force rotate due to request count
          } else {
            this.requestCounter++; // Increment request counter
            return this.currentKey.key; // Key is valid, return it
          }
        }
      }
      
      // Otherwise rotate to a new key
      return await this.rotateKey();
    } catch (error: any) {
      logError(error, { action: 'getKey' });
      throw error;
    }
  }

  async addKey(key: string): Promise<ApiKey> {
    try {
      const existingKey = await ApiKey.findOne({ key });
      
      if (existingKey) {
        existingKey.isActive = true;
        existingKey.failureCount = 0;
        existingKey.rateLimitResetAt = null;
        await existingKey.save();

        logKeyEvent('Key Reactivated', {
          keyId: existingKey._id
        });

        return existingKey;
      }

      const newKey = await ApiKey.create({ key });
      
      logKeyEvent('New Key Added', {
        keyId: newKey._id
      });

      return newKey;
    } catch (error: any) {
      logError(error, { action: 'addKey' });
      throw error;
    }
  }
}

// Export a singleton instance
const keyManager = new KeyManager();
export default keyManager;