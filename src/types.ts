/**
 * Type definitions for BreezeDB
 */

/**
 * Configuration options for BreezeDB instance
 */
export interface BreezeDBOptions {
  /** Enable gzip compression for storage efficiency */
  compression?: boolean;
  /** Enable AES-256-CBC encryption for data security */
  encryption?: boolean;
  /** Encryption key (required if encryption is enabled) */
  encryptionKey?: string;
  /** Enable automatic saving to disk */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds (default: 5000) */
  autoSaveInterval?: number;
  /** TTL cleanup interval in milliseconds (default: 60000) */
  ttlCleanupInterval?: number;
  /** Pretty-print JSON output for readability */
  pretty?: boolean;
}

/**
 * Represents a single operation in a batch
 */
export interface BatchOperation {
  /** Operation type */
  type: 'set' | 'delete';
  /** Key to operate on */
  key: string;
  /** Value to set (for 'set' operations) */
  value?: any;
  /** TTL in seconds (for 'set' operations) */
  ttl?: number;
}

/**
 * Result of a batch operation
 */
export interface BatchResult {
  /** Operation type */
  type: 'set' | 'delete';
  /** Key that was operated on */
  key: string;
  /** Whether the operation was successful */
  success: boolean;
}

/**
 * TTL data mapping keys to expiration timestamps
 */
export interface TTLData {
  /** Key to expiration timestamp mapping */
  [key: string]: number;
}

/**
 * Structure of serialized database data
 */
export interface SerializedData {
  /** The actual key-value data */
  data: Record<string, any>;
  /** TTL expiration timestamps */
  ttl: TTLData;
  /** Database version for compatibility checking */
  version: string;
  /** Serialization timestamp */
  timestamp: number;
}

/**
 * Result of loading data from disk
 */
export interface LoadResult {
  /** Loaded data as Map */
  data: Map<string, any>;
  /** TTL data */
  ttlData: TTLData;
}

// Event types

/**
 * Event data for 'set' operations
 */
export interface SetEvent {
  /** The key that was set */
  key: string;
  /** The new value */
  value: any;
  /** The previous value (if any) */
  oldValue?: any;
  /** TTL in seconds (null for permanent) */
  ttl: number | null;
}

/**
 * Event data for 'get' operations
 */
export interface GetEvent {
  /** The key that was retrieved */
  key: string;
  /** The retrieved value */
  value: any;
}

/**
 * Event data for 'delete' operations
 */
export interface DeleteEvent {
  /** The key that was deleted */
  key: string;
  /** The previous value (if any) */
  oldValue?: any;
}

/**
 * Event data for expired key cleanup
 */
export interface ExpiredEvent {
  /** Array of expired keys that were cleaned up */
  keys: string[];
}

/**
 * Event data for batch operations
 */
export interface BatchEvent {
  /** The operations that were executed */
  operations: BatchOperation[];
  /** The results of each operation */
  results: BatchResult[];
}

/**
 * Event data for clear operations
 */
export interface ClearEvent {
  /** Number of keys that were cleared */
  size: number;
}

/**
 * Event data for save operations
 */
export interface SaveEvent {
  /** File path where data was saved */
  filePath: string;
}

/**
 * Event data for load operations
 */
export interface LoadEvent {
  /** File path from which data was loaded */
  filePath: string;
  /** Number of keys loaded */
  size: number;
}

/**
 * Event data for TTL set operations
 */
export interface TTLSetEvent {
  /** The key for which TTL was set */
  key: string;
  /** TTL in seconds */
  ttl: number;
}

/**
 * Event data for TTL clear operations
 */
export interface TTLClearedEvent {
  /** The key for which TTL was cleared */
  key: string;
}

/**
 * Type-safe event map for BreezeDB event emitter
 */
export interface BreezeDBEventMap {
  /** Emitted when a key is set */
  set: SetEvent;
  /** Emitted when a key is retrieved */
  get: GetEvent;
  /** Emitted when a key is deleted */
  delete: DeleteEvent;
  /** Emitted when keys expire and are cleaned up */
  expired: ExpiredEvent;
  /** Emitted when batch operations are executed */
  batch: BatchEvent;
  /** Emitted when the database is cleared */
  clear: ClearEvent;
  /** Emitted when data is saved to disk */
  save: SaveEvent;
  /** Emitted when data is loaded from disk */
  load: LoadEvent;
  /** Emitted when TTL is set for a key */
  'ttl-set': TTLSetEvent;
  /** Emitted when TTL is cleared for a key */
  'ttl-cleared': TTLClearedEvent;
  /** Emitted when an error occurs */
  error: Error;
}
