import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import type { BatchOperation } from './types.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Encryption utilities using AES-256-CBC
 * Provides methods for encrypting and decrypting data with AES-256-CBC algorithm
 */
export class EncryptionUtils {
  /**
   * Encrypts data using AES-256-CBC encryption
   * @param data - The data to encrypt (Buffer or string)
   * @param encryptionKey - The encryption key
   * @returns Encrypted data as Buffer with IV prepended
   * @throws Error if encryption key is not provided
   */
  static encrypt(data: Buffer | string, encryptionKey: string): Buffer {
    if (!encryptionKey) {
      throw new Error('Encryption key required');
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypts data using AES-256-CBC decryption
   * @param data - The encrypted data (Buffer with IV prepended)
   * @param encryptionKey - The encryption key
   * @returns Decrypted data as Buffer
   * @throws Error if encryption key is not provided or data is invalid
   */
  static decrypt(data: Buffer, encryptionKey: string): Buffer {
    if (!encryptionKey) {
      throw new Error('Encryption key required');
    }

    if (data.length < 16) {
      throw new Error('Invalid encrypted data: insufficient length for IV');
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(encryptionKey).digest();

    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }
}

/**
 * Compression utilities using gzip
 * Provides methods for compressing and decompressing data with gzip
 */
export class CompressionUtils {
  /**
   * Compresses data asynchronously using gzip
   * @param data - The string data to compress
   * @returns Promise resolving to compressed Buffer
   */
  static async compress(data: string): Promise<Buffer> {
    return await gzip(Buffer.from(data, 'utf8'));
  }

  /**
   * Compresses data synchronously using gzip
   * @param data - The string data to compress
   * @returns Compressed Buffer
   */
  static compressSync(data: string): Buffer {
    return zlib.gzipSync(Buffer.from(data, 'utf8'));
  }

  /**
   * Decompresses data asynchronously using gzip
   * @param data - The compressed Buffer to decompress
   * @returns Promise resolving to decompressed Buffer
   */
  static async decompress(data: Buffer): Promise<Buffer> {
    return await gunzip(data);
  }

  /**
   * Decompresses data synchronously using gzip
   * @param data - The compressed Buffer to decompress
   * @returns Decompressed Buffer
   */
  static decompressSync(data: Buffer): Buffer {
    return zlib.gunzipSync(data);
  }
}

/**
 * Validation utilities
 * Provides methods for validating input parameters
 */
export class ValidationUtils {
  /**
   * Validates that a key is a non-empty string
   * @param key - The key to validate
   * @throws Error if key is not a non-empty string
   */
  static validateKey(key: unknown): asserts key is string {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
  }

  /**
   * Validates that TTL is either null or a positive number
   * @param ttl - The TTL value to validate
   * @throws Error if TTL is not null and not a positive number
   */
  static validateTTL(ttl: unknown): asserts ttl is number | null {
    if (
      ttl !== null &&
      (typeof ttl !== 'number' || ttl <= 0 || !isFinite(ttl) || ttl > Number.MAX_SAFE_INTEGER)
    ) {
      throw new Error('TTL must be a positive finite number');
    }
  }

  /**
   * Validates that batch operations are properly formatted
   * @param operations - The operations array to validate
   * @throws Error if operations is not a valid array of BatchOperation objects
   */
  static validateBatchOperations(operations: unknown): asserts operations is BatchOperation[] {
    if (!Array.isArray(operations)) {
      throw new Error('Operations must be an array');
    }

    for (const op of operations) {
      if (!op || typeof op !== 'object') {
        throw new Error('Each operation must be an object');
      }

      const { type } = op as { type?: unknown };
      if (!['set', 'delete'].includes(type as string)) {
        throw new Error(`Unknown operation type: ${type}`);
      }
    }
  }
}
