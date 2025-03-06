import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_FILE = join(__dirname, '../data/keys.json');

class ApiKey {
  constructor(data) {
    this.key = data.key;
    this.isActive = data.isActive ?? true;
    this.lastUsed = data.lastUsed ? new Date(data.lastUsed) : null;
    this.rateLimitResetAt = data.rateLimitResetAt ? new Date(data.rateLimitResetAt) : null;
    this.failureCount = data.failureCount ?? 0;
     this.requestCount = data.requestCount ?? 0;
    this._id = data._id ?? Date.now().toString();
  }

  static #filterKey(key, query) {
    if (query.isActive && !key.isActive) return false;
    if (query.$or) {
      return query.$or.some(condition => {
        if (condition.rateLimitResetAt === null) {
          return key.rateLimitResetAt === null;
        }
        if (condition.rateLimitResetAt?.$lte) {
          return !key.rateLimitResetAt || new Date(key.rateLimitResetAt) <= new Date();
        }
        return false;
      });
    }
    if (query.key) return key.key === query.key;
    return false;
  }

  static async findOne(query) {
    const keys = await this.#readKeys();
    return keys.find(key => this.#filterKey(key, query));
  }

  static async findAll(query) {
    const keys = await this.#readKeys();
    return keys.filter(key => this.#filterKey(key, query));
  }

  static async create(data) {
    const keys = await this.#readKeys();
    const newKey = new ApiKey(data);
    keys.push(newKey);
    await this.#writeKeys(keys);
    return newKey;
  }

  async save() {
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

  static async #readKeys() {
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf8');
      const keys = JSON.parse(data);
      return keys.map(k => new ApiKey(k));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create directory if it doesn't exist
        await fs.mkdir(dirname(KEYS_FILE), { recursive: true });
        await fs.writeFile(KEYS_FILE, '[]');
        return [];
      }
      throw error;
    }
  }

  static async #writeKeys(keys) {
    await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2));
  }
}

export default ApiKey;