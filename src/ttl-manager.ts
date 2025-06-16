import type { EventEmitter } from 'events';
import type { TTLData } from './types.js';

/**
 * TTL (Time To Live) Manager
 * Handles expiration logic for database keys with automatic cleanup
 */
export class TTLManager {
  /** Map storing key -> expiration timestamp mappings */
  private ttlData: Map<string, number> = new Map();
  /** Event emitter for TTL-related events */
  private eventEmitter: EventEmitter | null;
  /** Interval timer for periodic cleanup */
  private cleanupInterval: NodeJS.Timeout | null = null;
  /** Cleanup interval in milliseconds */
  private cleanupIntervalMs: number;

  /**
   * Creates a new TTL manager instance
   * @param eventEmitter - Optional event emitter for TTL events
   * @param cleanupIntervalMs - Cleanup interval in milliseconds (default: 60000)
   */
  constructor(eventEmitter?: EventEmitter, cleanupIntervalMs: number = 60000) {
    this.eventEmitter = eventEmitter || null;
    this.cleanupIntervalMs = cleanupIntervalMs;

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Set TTL for a key
   * @param key - The key to set TTL for
   * @param ttlSeconds - TTL duration in seconds
   */
  setTTL(key: string, ttlSeconds: number): void {
    const expiration = Date.now() + ttlSeconds * 1000;
    this.ttlData.set(key, expiration);
    this.eventEmitter?.emit('ttl-set', { key, ttl: ttlSeconds });
  }

  /**
   * Get remaining TTL for a key in seconds
   * @param key - The key to check TTL for
   * @returns Remaining TTL in seconds, or null if no TTL set or expired
   */
  getTTL(key: string): number | null {
    const expiration = this.ttlData.get(key);
    if (!expiration) return null;

    const remaining = Math.max(0, expiration - Date.now()) / 1000;
    return remaining > 0 ? remaining : null;
  }

  /**
   * Clear TTL for a key
   * @param key - The key to clear TTL for
   * @returns True if TTL was cleared, false if no TTL was set
   */
  clearTTL(key: string): boolean {
    const hadTTL = this.ttlData.has(key);
    this.ttlData.delete(key);

    if (hadTTL) {
      this.eventEmitter?.emit('ttl-cleared', { key });
    }

    return hadTTL;
  }

  /**
   * Check if a key has expired
   * @param key - The key to check
   * @returns True if the key has expired, false otherwise
   */
  isExpired(key: string): boolean {
    const expiration = this.ttlData.get(key);
    return expiration ? Date.now() >= expiration : false;
  }

  /**
   * Get all expired keys
   * @returns Array of keys that have expired
   */
  getExpiredKeys(): string[] {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, expiration] of this.ttlData.entries()) {
      if (now >= expiration) {
        expiredKeys.push(key);
      }
    }

    return expiredKeys;
  }

  /**
   * Remove expired keys from TTL tracking
   * @param expiredKeys - Array of expired keys to remove
   */
  removeExpiredKeys(expiredKeys: string[]): void {
    for (const key of expiredKeys) {
      this.ttlData.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.eventEmitter?.emit('expired', { keys: expiredKeys });
    }
  }

  /**
   * Get all TTL data for serialization
   * @returns TTL data object with non-expired keys only
   */
  getAllTTLData(): TTLData {
    const result: TTLData = {};
    const now = Date.now();

    for (const [key, expiration] of this.ttlData.entries()) {
      if (now < expiration) {
        // Only include non-expired
        result[key] = expiration;
      }
    }

    return result;
  }

  /**
   * Load TTL data from deserialization
   * @param ttlData - TTL data to load
   */
  loadTTLData(ttlData: TTLData): void {
    this.ttlData.clear();

    if (ttlData) {
      for (const [key, expiration] of Object.entries(ttlData)) {
        this.ttlData.set(key, expiration);
      }
    }
  }

  /**
   * Start periodic cleanup of expired keys
   * Runs cleanup at the configured interval
   */
  private startCleanup(): void {
    // Clean up expired keys at configured interval
    this.cleanupInterval = setInterval(() => {
      const expiredKeys = this.getExpiredKeys();
      this.removeExpiredKeys(expiredKeys);
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all TTL data
   */
  clear(): void {
    this.ttlData.clear();
  }

  /**
   * Get count of keys with TTL
   * @returns Number of keys currently tracked for TTL
   */
  size(): number {
    return this.ttlData.size;
  }
}
