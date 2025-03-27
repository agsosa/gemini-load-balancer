import fs from 'fs/promises';
import { join, dirname } from 'path';
import { mkdir } from 'fs/promises';

// Define the data directory path
const DATA_DIR = join(process.cwd(), 'data');
const KEYS_FILE = join(DATA_DIR, 'keys.json');

// Define the ApiKey interface
export interface ApiKeyData {
  key: string;
  isActive: boolean;
  lastUsed: string | null;
  rateLimitResetAt: string | null;
  failureCount: number;
  requestCount: number;
  _id: string;
}

export class ApiKey implements ApiKeyData {
  key: string;
  isActive: boolean;
  lastUsed: string | null;
  rateLimitResetAt: string | null;
  failureCount: number;
  requestCount: number;
  _id: string;

  constructor(data: Partial<ApiKeyData>) {
    this.key = data.key || '';
    this.isActive = data.isActive ?? true;
    this.lastUsed = data.lastUsed || null;
    this.rateLimitResetAt = data.rateLimitResetAt || null;
    this.failureCount = data.failureCount ?? 0;
    this.requestCount = data.requestCount ?? 0;
    this._id = data._id || Date.now().toString();
  }

  static async #ensureDataDir() {
    try {
      await mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  static #filterKey(key: ApiKeyData, query: any): boolean {
    if (query.isActive !== undefined && key.isActive !== query.isActive) return false;
    if (query._id && key._id !== query._id) return false;
    if (query.key && key.key !== query.key) return false;
    
    if (query.$or) {
      return query.$or.some((condition: any) => {
        if (condition.rateLimitResetAt === null) {
          return key.rateLimitResetAt === null;
        }
        if (condition.rateLimitResetAt?.$lte) {
          return !key.rateLimitResetAt || new Date(key.rateLimitResetAt) <= new Date();
        }
        return false;
      });
    }
    
    return true;
  }

  static async findOne(query: any): Promise<ApiKey | null> {
    const keys = await this.#readKeys();
    const foundKey = keys.find(key => this.#filterKey(key, query));
    return foundKey ? new ApiKey(foundKey) : null;
  }

  static async findAll(query: any = {}): Promise<ApiKey[]> {
    const keys = await this.#readKeys();
    return keys
      .filter(key => this.#filterKey(key, query))
      .map(key => new ApiKey(key));
  }

  static async create(data: Partial<ApiKeyData>): Promise<ApiKey> {
    const keys = await this.#readKeys();
    const newKey = new ApiKey(data);
    keys.push(newKey);
    await this.#writeKeys(keys);
    return newKey;
  }

  async save(): Promise<ApiKey> {
    const keys = await ApiKey.#readKeys();
    const index = keys.findIndex(k => k._id === this._id);
    
    if (index !== -1) {
      keys[index] = this;
    } else {
      keys.push(this);
    }
    
    await ApiKey.#writeKeys(keys);
    return this;
  }

  async delete(): Promise<void> {
    const keys = await ApiKey.#readKeys();
    const filteredKeys = keys.filter(k => k._id !== this._id);
    await ApiKey.#writeKeys(filteredKeys);
  }

  static async deleteById(id: string): Promise<boolean> {
    const keys = await this.#readKeys();
    const initialLength = keys.length;
    const filteredKeys = keys.filter(k => k._id !== id);
    
    if (filteredKeys.length === initialLength) {
      return false; // No key was deleted
    }
    
    await this.#writeKeys(filteredKeys);
    return true;
  }

  static async #readKeys(): Promise<ApiKeyData[]> {
    try {
      await this.#ensureDataDir();
      const data = await fs.readFile(KEYS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, create it with empty array
        await this.#writeKeys([]);
        return [];
      }
      throw error;
    }
  }

  static async #writeKeys(keys: ApiKeyData[]): Promise<void> {
    await this.#ensureDataDir();
    await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2));
  }
}