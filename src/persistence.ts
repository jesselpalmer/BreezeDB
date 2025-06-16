import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { EventEmitter } from 'events';
import { EncryptionUtils, CompressionUtils } from './utils.js';
import type { BreezeDBOptions, TTLData, SerializedData, LoadResult } from './types.js';

/**
 * Persistence Manager
 * Handles all file I/O operations with compression and encryption support
 */
export class PersistenceManager {
  /** Resolved path to the main database file */
  public readonly filePath: string;
  /** Path to the backup file */
  public readonly backupPath: string;
  /** Path to the temporary file used during writes */
  private readonly tempPath: string;
  /** Database configuration options */
  private readonly options: BreezeDBOptions;
  /** Event emitter for persistence events */
  private readonly eventEmitter: EventEmitter | null;

  /** Flag indicating if a write operation is in progress */
  public isWriting: boolean = false;
  /** Queue of pending write callbacks */
  private writeQueue: Array<() => void> = [];

  /**
   * Creates a new persistence manager instance
   * @param filePath - Path to the database file
   * @param options - Database configuration options
   * @param eventEmitter - Optional event emitter for persistence events
   */
  constructor(filePath: string, options: BreezeDBOptions = {}, eventEmitter?: EventEmitter) {
    this.filePath = path.resolve(filePath);
    this.backupPath = this.filePath + '.backup';
    this.tempPath = this.filePath + '.tmp';
    this.options = options;
    this.eventEmitter = eventEmitter || null;

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Serialize data to JSON string
   * @param data - Map of key-value data to serialize
   * @param ttlData - TTL data to include in serialization
   * @returns Serialized JSON string
   */
  private serialize(data: Map<string, any>, ttlData: TTLData): string {
    const serialized: SerializedData = {
      data: Object.fromEntries(data),
      ttl: ttlData,
      version: '1.0.0',
      timestamp: Date.now(),
    };

    return JSON.stringify(serialized, null, this.options.pretty ? 2 : 0);
  }

  /**
   * Deserialize JSON string to data
   * @param serializedData - JSON string to deserialize
   * @returns Object containing loaded data and TTL information
   */
  private deserialize(serializedData: string): LoadResult {
    const parsed: SerializedData = JSON.parse(serializedData);

    const data = new Map<string, any>();
    const ttlData: TTLData = {};

    // Load data
    if (parsed.data) {
      for (const [key, value] of Object.entries(parsed.data)) {
        data.set(key, value);
      }
    }

    // Load TTL data
    if (parsed.ttl) {
      Object.assign(ttlData, parsed.ttl);
    }

    return { data, ttlData };
  }

  /**
   * Process data through compression and encryption pipeline
   * @param data - Raw data string to process
   * @returns Promise resolving to processed data (Buffer or string)
   */
  private async processForStorage(data: string): Promise<Buffer | string> {
    let processedData: Buffer | string = data;

    // Apply compression if enabled
    if (this.options.compression) {
      processedData = await CompressionUtils.compress(processedData);
    }

    // Apply encryption if enabled
    if (this.options.encryption && this.options.encryptionKey) {
      processedData = EncryptionUtils.encrypt(processedData, this.options.encryptionKey);
    }

    return processedData;
  }

  /**
   * Process data through decryption and decompression pipeline
   * @param data - Processed data from storage
   * @returns Promise resolving to original data string
   */
  private async processFromStorage(data: Buffer): Promise<string> {
    let processedData: Buffer = data;

    // Apply decryption if enabled
    if (this.options.encryption && this.options.encryptionKey) {
      processedData = EncryptionUtils.decrypt(processedData, this.options.encryptionKey);
    }

    // Apply decompression if enabled
    if (this.options.compression) {
      processedData = await CompressionUtils.decompress(processedData);
    }

    return processedData.toString('utf8');
  }

  /**
   * Synchronous version of processForStorage
   * @param data - Raw data string to process
   * @returns Processed data (Buffer or string)
   */
  private processForStorageSync(data: string): Buffer | string {
    let processedData: Buffer | string = data;

    // Apply compression if enabled
    if (this.options.compression) {
      processedData = CompressionUtils.compressSync(processedData);
    }

    // Apply encryption if enabled
    if (this.options.encryption && this.options.encryptionKey) {
      processedData = EncryptionUtils.encrypt(processedData, this.options.encryptionKey);
    }

    return processedData;
  }

  /**
   * Synchronous version of processFromStorage
   * @param data - Processed data from storage
   * @returns Original data string
   */
  private processFromStorageSync(data: Buffer): string {
    let processedData: Buffer = data;

    // Apply decryption if enabled
    if (this.options.encryption && this.options.encryptionKey) {
      processedData = EncryptionUtils.decrypt(processedData, this.options.encryptionKey);
    }

    // Apply decompression if enabled
    if (this.options.compression) {
      processedData = CompressionUtils.decompressSync(processedData);
    }

    return processedData.toString('utf8');
  }

  /**
   * Save data to disk asynchronously
   * @param data - Map of key-value data to save
   * @param ttlData - TTL data to save
   * @returns Promise that resolves when save is complete
   */
  async save(data: Map<string, any>, ttlData: TTLData): Promise<void> {
    if (this.isWriting) {
      return new Promise<void>(resolve => {
        this.writeQueue.push(resolve);
      });
    }

    this.isWriting = true;

    try {
      const serialized = this.serialize(data, ttlData);
      const processedData = await this.processForStorage(serialized);

      // Write to temp file first, then rename (atomic operation)
      await fsp.writeFile(this.tempPath, processedData);

      // Create backup if original exists
      if (fs.existsSync(this.filePath)) {
        await fsp.copyFile(this.filePath, this.backupPath);
      }

      // Atomic rename
      await fsp.rename(this.tempPath, this.filePath);

      this.eventEmitter?.emit('save', { filePath: this.filePath });
    } catch (error) {
      this.eventEmitter?.emit('error', error);
      throw error;
    } finally {
      this.isWriting = false;

      // Process queued saves - they will retry the operation
      const callbacks = this.writeQueue.splice(0);
      for (const callback of callbacks) {
        callback();
      }
    }
  }

  /**
   * Save data to disk synchronously
   * @param data - Map of key-value data to save
   * @param ttlData - TTL data to save
   * @throws Error if async save is in progress or save fails
   */
  saveSync(data: Map<string, any>, ttlData: TTLData): void {
    if (this.isWriting) {
      throw new Error('Cannot save synchronously while async save is in progress');
    }

    try {
      const serialized = this.serialize(data, ttlData);
      const processedData = this.processForStorageSync(serialized);

      // Create backup if original exists
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
      }

      // Write to temp file first, then rename (atomic operation)
      fs.writeFileSync(this.tempPath, processedData);
      fs.renameSync(this.tempPath, this.filePath);

      this.eventEmitter?.emit('save', { filePath: this.filePath });
    } catch (error) {
      this.eventEmitter?.emit('error', error);
      throw error;
    }
  }

  /**
   * Load data from disk asynchronously
   * @returns Promise resolving to loaded data and TTL information
   */
  async load(): Promise<LoadResult> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { data: new Map(), ttlData: {} };
      }

      const rawData = await fsp.readFile(this.filePath);
      const serializedData = await this.processFromStorage(rawData);
      const result = this.deserialize(serializedData);

      this.eventEmitter?.emit('load', {
        filePath: this.filePath,
        size: result.data.size,
      });

      return result;
    } catch (error) {
      // Try to load from backup
      if (fs.existsSync(this.backupPath)) {
        this.eventEmitter?.emit(
          'error',
          new Error('Main file corrupted, attempting to load from backup')
        );
        try {
          await fsp.copyFile(this.backupPath, this.filePath);
          return await this.load();
        } catch {
          this.eventEmitter?.emit('error', new Error('Backup file also corrupted'));
        }
      }

      this.eventEmitter?.emit('error', error);
      throw error;
    }
  }

  /**
   * Load data from disk synchronously
   * @returns Loaded data and TTL information
   */
  loadSync(): LoadResult {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { data: new Map(), ttlData: {} };
      }

      const rawData = fs.readFileSync(this.filePath);
      const serializedData = this.processFromStorageSync(rawData);
      const result = this.deserialize(serializedData);

      this.eventEmitter?.emit('load', {
        filePath: this.filePath,
        size: result.data.size,
      });

      return result;
    } catch (error) {
      // Try to load from backup
      if (fs.existsSync(this.backupPath)) {
        this.eventEmitter?.emit(
          'error',
          new Error('Main file corrupted, attempting to load from backup')
        );
        try {
          fs.copyFileSync(this.backupPath, this.filePath);
          return this.loadSync();
        } catch {
          this.eventEmitter?.emit('error', new Error('Backup file also corrupted'));
        }
      }

      this.eventEmitter?.emit('error', error);
      throw error;
    }
  }
}
