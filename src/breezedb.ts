import { EventEmitter } from 'events';
import { ValidationUtils } from './utils.js';
import { TTLManager } from './ttl-manager.js';
import { PersistenceManager } from './persistence.js';
import type { BreezeDBOptions, BatchOperation, BatchResult, BreezeDBEventMap } from './types.js';

/**
 * BreezeDB - A lightweight, feature-rich persistent key-value store
 *
 * Provides a simple key-value database with advanced features:
 * - TTL (Time To Live) support with automatic expiration
 * - Optional compression with gzip
 * - Optional encryption with AES-256-CBC
 * - Batch operations for efficiency
 * - Event system for monitoring operations
 * - Atomic writes with backup and recovery
 *
 * @example
 * ```typescript
 * const db = new BreezeDB('./data.json');
 * db.set('user:1', { name: 'Alice', age: 30 });
 * const user = db.get('user:1');
 * ```
 */
class BreezeDB extends EventEmitter {
  /** Path to the main database file */
  public readonly filePath: string;
  /** Path to the backup file */
  public readonly backupPath: string;
  /** Database configuration options with defaults applied */
  public readonly options: Required<BreezeDBOptions>;

  /** TTL manager for handling key expiration */
  private ttlManager: TTLManager;
  /** Persistence manager for file I/O operations */
  public persistenceManager: PersistenceManager;
  /** In-memory key-value store */
  private data: Map<string, any> = new Map();
  /** Flag indicating if data has been modified since last save */
  private isDirty: boolean = false;
  /** Timer for automatic saving */
  private autoSaveTimer: NodeJS.Timeout | null = null;
  /** Bound cleanup function for process exit handling */
  private boundCleanup: () => void;

  /**
   * Creates a new BreezeDB instance
   * @param filePath - Path to the database file (default: './breezedb.json')
   * @param options - Configuration options for the database
   * @throws Error if encryption is enabled but no encryption key is provided
   */
  constructor(filePath: string = './breezedb.json', options: BreezeDBOptions = {}) {
    super();

    // Configuration options with defaults
    this.options = {
      compression: options.compression ?? false,
      encryption: options.encryption ?? false,
      encryptionKey: options.encryptionKey ?? undefined,
      autoSave: options.autoSave ?? true,
      autoSaveInterval: options.autoSaveInterval ?? 5000,
      ttlCleanupInterval: options.ttlCleanupInterval ?? 60000,
      pretty: options.pretty ?? false,
    } as Required<BreezeDBOptions>;

    // Validate encryption setup
    if (this.options.encryption && !this.options.encryptionKey) {
      throw new Error('Encryption key is required when encryption is enabled');
    }

    // Store file path for compatibility
    this.filePath = filePath;

    // Initialize managers
    this.ttlManager = new TTLManager(this, this.options.ttlCleanupInterval);
    this.persistenceManager = new PersistenceManager(filePath, this.options, this);

    // Expose paths for compatibility
    this.backupPath = this.persistenceManager.backupPath;

    // Load existing data
    try {
      this.loadSync();
    } catch (error) {
      // If loading fails, start with empty database
      console.warn('Failed to load existing data:', (error as Error).message);
      this.data.clear();
      this.ttlManager.clear();
    }

    // Setup auto-save if enabled
    if (this.options.autoSave) {
      this.startAutoSave();
    }

    // Handle process exit
    this.boundCleanup = this.cleanup.bind(this);
    process.on('exit', this.boundCleanup);
    process.on('SIGINT', this.boundCleanup);
    process.on('SIGTERM', this.boundCleanup);
  }

  // === CORE OPERATIONS ===

  /**
   * Set a key-value pair with optional TTL
   * @template T - Type of the value being stored
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (null for permanent)
   * @returns This BreezeDB instance for method chaining
   * @throws Error if key is invalid or TTL is not a positive number
   * @fires BreezeDB#set
   */
  set<T = any>(key: string, value: T, ttl: number | null = null): this {
    ValidationUtils.validateKey(key);
    ValidationUtils.validateTTL(ttl);

    const oldValue = this.data.get(key);

    // Set the value
    this.data.set(key, value);

    // Handle TTL
    if (ttl !== null) {
      this.ttlManager.setTTL(key, ttl);
    } else {
      this.ttlManager.clearTTL(key);
    }

    this.markDirty();
    this.emit('set', { key, value, oldValue, ttl });
    return this;
  }

  /**
   * Get a value by key
   * @template T - Expected type of the returned value
   * @param key - The key to retrieve
   * @returns The value associated with the key, or undefined if not found or expired
   * @throws Error if key is invalid
   * @fires BreezeDB#get
   */
  get<T = any>(key: string): T | undefined {
    ValidationUtils.validateKey(key);

    // Check if key has expired
    if (this.ttlManager.isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    const value = this.data.get(key);
    this.emit('get', { key, value });
    return value;
  }

  /**
   * Check if key exists and is not expired
   * @param key - The key to check
   * @returns True if the key exists and is not expired, false otherwise
   * @throws Error if key is invalid
   */
  has(key: string): boolean {
    ValidationUtils.validateKey(key);

    if (this.ttlManager.isExpired(key)) {
      this.delete(key);
      return false;
    }

    return this.data.has(key);
  }

  /**
   * Delete a key
   * @param key - The key to delete
   * @returns True if the key existed and was deleted, false if it didn't exist
   * @throws Error if key is invalid
   * @fires BreezeDB#delete
   */
  delete(key: string): boolean {
    ValidationUtils.validateKey(key);

    const existed = this.data.has(key);
    const oldValue = this.data.get(key);

    this.data.delete(key);
    this.ttlManager.clearTTL(key);

    if (existed) {
      this.markDirty();
      this.emit('delete', { key, oldValue });
    }

    return existed;
  }

  /**
   * Clear all data
   * @returns This BreezeDB instance for method chaining
   * @fires BreezeDB#clear
   */
  clear(): this {
    const size = this.data.size;
    this.data.clear();
    this.ttlManager.clear();

    if (size > 0) {
      this.markDirty();
      this.emit('clear', { size });
    }

    return this;
  }

  // === BATCH OPERATIONS ===

  /**
   * Execute multiple operations atomically
   * @param operations - Array of operations to execute
   * @returns Array of results for each operation
   * @throws Error if operations array is invalid
   * @fires BreezeDB#batch
   */
  batch(operations: BatchOperation[]): BatchResult[] {
    ValidationUtils.validateBatchOperations(operations);

    const results: BatchResult[] = [];

    for (const op of operations) {
      const { type, key, value, ttl } = op;

      switch (type) {
        case 'set':
          this.set(key, value, ttl ?? null);
          results.push({ type, key, success: true });
          break;

        case 'delete': {
          const deleted = this.delete(key);
          results.push({ type, key, success: deleted });
          break;
        }
      }
    }

    this.emit('batch', { operations, results });
    return results;
  }

  // === TTL METHODS ===

  /**
   * Set TTL for an existing key
   * @param key - The key to set TTL for
   * @param ttl - TTL duration in seconds
   * @returns True if TTL was set, false if key doesn't exist
   * @throws Error if TTL is not a positive number
   * @fires BreezeDB#ttl-set
   */
  setTTL(key: string, ttl: number): boolean {
    ValidationUtils.validateTTL(ttl);

    if (!this.has(key)) {
      return false;
    }

    this.ttlManager.setTTL(key, ttl);
    this.markDirty();
    return true;
  }

  /**
   * Get remaining TTL for a key
   * @param key - The key to check TTL for
   * @returns Remaining TTL in seconds, or null if no TTL set or key doesn't exist
   */
  getTTL(key: string): number | null {
    return this.ttlManager.getTTL(key);
  }

  /**
   * Clear TTL for a key
   * @param key - The key to clear TTL for
   * @returns True if TTL was cleared, false if no TTL was set
   * @fires BreezeDB#ttl-cleared
   */
  clearTTL(key: string): boolean {
    const hadTTL = this.ttlManager.clearTTL(key);

    if (hadTTL) {
      this.markDirty();
    }

    return hadTTL;
  }

  // === UTILITY METHODS ===

  /**
   * Get all non-expired keys
   * @returns Array of all keys that are not expired
   */
  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.data.keys());
  }

  /**
   * Get all non-expired values
   * @returns Array of all values for non-expired keys
   */
  values(): any[] {
    this.cleanupExpired();
    return Array.from(this.data.values());
  }

  /**
   * Get all non-expired entries
   * @returns Array of [key, value] pairs for non-expired keys
   */
  entries(): Array<[string, any]> {
    this.cleanupExpired();
    return Array.from(this.data.entries());
  }

  /**
   * Get number of non-expired keys
   * @returns Count of non-expired keys in the database
   */
  size(): number {
    this.cleanupExpired();
    return this.data.size;
  }

  /**
   * Check if database is empty
   * @returns True if database has no non-expired keys, false otherwise
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  // === PERSISTENCE METHODS ===

  /**
   * Save database to disk asynchronously
   * @returns Promise that resolves when save is complete
   * @fires BreezeDB#save
   */
  async save(): Promise<void> {
    const ttlData = this.ttlManager.getAllTTLData();
    await this.persistenceManager.save(this.data, ttlData);
    this.isDirty = false;
  }

  /**
   * Save database to disk synchronously
   * @throws Error if save fails
   * @fires BreezeDB#save
   */
  saveSync(): void {
    const ttlData = this.ttlManager.getAllTTLData();
    this.persistenceManager.saveSync(this.data, ttlData);
    this.isDirty = false;
  }

  /**
   * Load database from disk asynchronously
   * @returns Promise that resolves when load is complete
   * @fires BreezeDB#load
   */
  async load(): Promise<void> {
    const { data, ttlData } = await this.persistenceManager.load();
    this.data = data;
    this.ttlManager.loadTTLData(ttlData);
    this.cleanupExpired();
  }

  /**
   * Load database from disk synchronously
   * @throws Error if load fails
   * @fires BreezeDB#load
   */
  loadSync(): void {
    const { data, ttlData } = this.persistenceManager.loadSync();
    this.data = data;
    this.ttlManager.loadTTLData(ttlData);
    this.cleanupExpired();
  }

  // === EVENT HANDLING ===

  /**
   * Add event listener with proper typing
   * @template K - Event name type
   * @param event - The event name to listen for
   * @param listener - The callback function for the event
   * @returns This BreezeDB instance for method chaining
   */
  on<K extends keyof BreezeDBEventMap>(
    event: K,
    listener: (data: BreezeDBEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }

  /**
   * Emit event with proper typing
   * @template K - Event name type
   * @param event - The event name to emit
   * @param data - The event data to emit
   * @returns True if the event had listeners, false otherwise
   */
  emit<K extends keyof BreezeDBEventMap>(event: K, data: BreezeDBEventMap[K]): boolean {
    return super.emit(event, data);
  }

  // === INTERNAL METHODS ===

  /**
   * Clean up expired keys
   */
  private cleanupExpired(): void {
    const expiredKeys = this.ttlManager.getExpiredKeys();

    for (const key of expiredKeys) {
      this.data.delete(key);
    }

    this.ttlManager.removeExpiredKeys(expiredKeys);

    if (expiredKeys.length > 0) {
      this.markDirty();
    }
  }

  /**
   * Mark database as dirty and schedule auto-save
   */
  private markDirty(): void {
    this.isDirty = true;

    if (this.options.autoSave && !this.autoSaveTimer) {
      this.autoSaveTimer = setTimeout(() => {
        this.autoSaveTimer = null;
        if (this.isDirty) {
          this.save().catch(error => this.emit('error', error as Error));
        }
      }, this.options.autoSaveInterval);
    }
  }

  /**
   * Start auto-save functionality
   */
  private startAutoSave(): void {
    // Auto-save is handled by markDirty()
  }

  /**
   * Cleanup resources and save pending changes
   * Called automatically on process exit or when close() is called
   */
  private cleanup(): void {
    // Save any pending changes
    if (this.isDirty && !this.persistenceManager.isWriting) {
      try {
        this.saveSync();
      } catch (error) {
        console.error('Failed to save on exit:', error);
      }
    }

    // Clear timers
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Stop TTL cleanup
    this.ttlManager.stopCleanup();

    // Remove event listeners
    process.removeListener('exit', this.boundCleanup);
    process.removeListener('SIGINT', this.boundCleanup);
    process.removeListener('SIGTERM', this.boundCleanup);
  }

  /**
   * Close database and clean up resources
   * Saves any pending changes and stops all timers and listeners
   */
  close(): void {
    this.cleanup();
    this.removeAllListeners();
  }
}

export default BreezeDB;
