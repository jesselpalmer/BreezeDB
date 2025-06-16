/**
 * @fileoverview BreezeDB - A lightweight, feature-rich persistent key-value store
 *
 * This is the main entry point for the BreezeDB package. It exports the primary
 * BreezeDB class as the default export, along with TypeScript types and utility
 * classes for advanced usage.
 *
 * @example
 * ```typescript
 * import BreezeDB from 'breezedb';
 * import type { BreezeDBOptions } from 'breezedb';
 *
 * const options: BreezeDBOptions = { compression: true };
 * const db = new BreezeDB('./data.json', options);
 * ```
 *
 * @author Jesse Palmer
 * @version 1.0.0
 */

/**
 * Export the main BreezeDB class as default
 * @see {@link BreezeDB} for the main database class
 */
export { default } from './breezedb.js';

/**
 * Export types for TypeScript users
 * These types provide full type safety when using BreezeDB in TypeScript
 */
export type {
  BreezeDBOptions,
  BatchOperation,
  BatchResult,
  TTLData,
  SerializedData,
  LoadResult,
  SetEvent,
  GetEvent,
  DeleteEvent,
  ExpiredEvent,
  BatchEvent,
  ClearEvent,
  SaveEvent,
  LoadEvent,
  TTLSetEvent,
  TTLClearedEvent,
  BreezeDBEventMap,
} from './types.js';

/**
 * Export utility classes for advanced users
 * These classes can be used directly for custom encryption, compression, or validation
 */
export { EncryptionUtils, CompressionUtils, ValidationUtils } from './utils.js';

/**
 * Export TTL manager for advanced TTL handling
 * @see {@link TTLManager} for TTL management functionality
 */
export { TTLManager } from './ttl-manager.js';

/**
 * Export persistence manager for custom file I/O
 * @see {@link PersistenceManager} for file persistence functionality
 */
export { PersistenceManager } from './persistence.js';
