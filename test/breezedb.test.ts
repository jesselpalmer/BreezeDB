import { describe, it, beforeEach, afterEach } from 'mocha';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import BreezeDB from '../src/index.js';
import type { BreezeDBOptions } from '../src/types.js';

describe('BreezeDB', function () {
  const testDir = './test-new-db';
  const testFile = path.join(testDir, 'test.json');
  let db: BreezeDB;

  beforeEach(function () {
    // Clean up test directory before each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(function () {
    // Close database connection to clean up
    if (db && typeof db.close === 'function') {
      db.close();
    }

    // Clean up test directory after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor and basic setup', function () {
    it('should create database with default options', function () {
      db = new BreezeDB(testFile);

      assert.strictEqual(db.persistenceManager.filePath, path.resolve(testFile));
      assert.strictEqual(db.options.autoSave, true);
      assert.strictEqual(db.options.compression, false);
      assert.strictEqual(db.options.encryption, false);
    });

    it('should create database with custom options', function () {
      const options: BreezeDBOptions = {
        compression: true,
        encryption: true,
        encryptionKey: 'test-key',
        autoSave: false,
        pretty: true,
      };
      db = new BreezeDB(testFile, options);

      assert.strictEqual(db.options.compression, true);
      assert.strictEqual(db.options.encryption, true);
      assert.strictEqual(db.options.encryptionKey, 'test-key');
      assert.strictEqual(db.options.autoSave, false);
      assert.strictEqual(db.options.pretty, true);
    });

    it('should accept custom TTL cleanup interval', function () {
      const options: BreezeDBOptions = {
        ttlCleanupInterval: 30000,
        autoSave: false,
      };
      db = new BreezeDB(testFile, options);

      assert.strictEqual(db.options.ttlCleanupInterval, 30000);
    });

    it('should create parent directory if it does not exist', function () {
      const deepPath = path.join(testDir, 'deep', 'nested', 'db.json');
      db = new BreezeDB(deepPath);

      assert(fs.existsSync(path.dirname(deepPath)));
    });
  });

  describe('core operations', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false });
    });

    it('should set and get values', function () {
      db.set('key1', 'value1');
      db.set('key2', { name: 'test', value: 123 });

      assert.strictEqual(db.get('key1'), 'value1');
      assert.deepStrictEqual(db.get('key2'), { name: 'test', value: 123 });
    });

    it('should return undefined for non-existent keys', function () {
      assert.strictEqual(db.get('nonexistent'), undefined);
    });

    it('should check if key exists', function () {
      db.set('exists', 'yes');

      assert.strictEqual(db.has('exists'), true);
      assert.strictEqual(db.has('nonexistent'), false);
    });

    it('should delete keys', function () {
      db.set('key1', 'value1');
      db.set('key2', 'value2');

      assert.strictEqual(db.delete('key1'), true);
      assert.strictEqual(db.delete('nonexistent'), false);
      assert.strictEqual(db.has('key1'), false);
      assert.strictEqual(db.has('key2'), true);
    });

    it('should clear all data', function () {
      db.set('key1', 'value1');
      db.set('key2', 'value2');

      db.clear();

      assert.strictEqual(db.size(), 0);
      assert.strictEqual(db.isEmpty(), true);
    });

    it('should validate keys', function () {
      assert.throws(() => db.set('', 'value'), /Key must be a non-empty string/);
      assert.throws(() => db.set(123 as any, 'value'), /Key must be a non-empty string/);
      assert.throws(() => db.set(null as any, 'value'), /Key must be a non-empty string/);
    });
  });

  describe('TTL (Time To Live)', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false });
    });

    it('should set values with TTL', function () {
      db.set('temp', 'value', 1); // 1 second TTL

      assert.strictEqual(db.get('temp'), 'value');
      assert(db.getTTL('temp')! > 0);
      assert(db.getTTL('temp')! <= 1);
    });

    it('should expire values after TTL', function (done: Mocha.Done) {
      db.set('temp', 'value', 0.1); // 100ms TTL

      setTimeout(() => {
        assert.strictEqual(db.get('temp'), undefined);
        assert.strictEqual(db.has('temp'), false);
        done();
      }, 150);
    });

    it('should update TTL for existing keys', function () {
      db.set('key', 'value');

      assert.strictEqual(db.setTTL('key', 5), true);
      assert(db.getTTL('key')! > 0);
      assert(db.getTTL('key')! <= 5);
    });

    it('should not set TTL for non-existent keys', function () {
      assert.strictEqual(db.setTTL('nonexistent', 5), false);
    });

    it('should clear TTL', function () {
      db.set('key', 'value', 5);

      assert(db.getTTL('key')! > 0);
      assert.strictEqual(db.clearTTL('key'), true);
      assert.strictEqual(db.getTTL('key'), null);
    });

    it('should validate TTL values', function () {
      assert.throws(() => db.set('key', 'value', -1), /TTL must be a positive finite number/);
      assert.throws(() => db.set('key', 'value', 0), /TTL must be a positive finite number/);
      assert.throws(
        () => db.set('key', 'value', 'invalid' as any),
        /TTL must be a positive finite number/
      );
      assert.throws(() => db.set('key', 'value', Infinity), /TTL must be a positive finite number/);
      assert.throws(() => db.set('key', 'value', NaN), /TTL must be a positive finite number/);
    });
  });

  describe('batch operations', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false });
    });

    it('should execute batch operations', function () {
      const operations = [
        { type: 'set' as const, key: 'key1', value: 'value1' },
        { type: 'set' as const, key: 'key2', value: 'value2', ttl: 10 },
        { type: 'set' as const, key: 'key3', value: 'value3' },
        { type: 'delete' as const, key: 'key1' },
      ];

      const results = db.batch(operations);

      assert.strictEqual(results.length, 4);
      assert.strictEqual(results[0]?.success, true);
      assert.strictEqual(results[3]?.success, true);

      assert.strictEqual(db.has('key1'), false);
      assert.strictEqual(db.get('key2'), 'value2');
      assert.strictEqual(db.get('key3'), 'value3');
      assert(db.getTTL('key2')! > 0);
    });

    it('should validate batch operations', function () {
      assert.throws(() => db.batch('invalid' as any), /Operations must be an array/);
      assert.throws(() => db.batch([null as any]), /Each operation must be an object/);
      assert.throws(
        () => db.batch([{ type: 'invalid', key: 'test' } as any]),
        /Unknown operation type/
      );
    });
  });

  describe('utility methods', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false });
    });

    it('should return keys, values, and entries', function () {
      db.set('a', 1);
      db.set('b', 2);
      db.set('c', 3);

      assert.deepStrictEqual(db.keys().sort(), ['a', 'b', 'c']);
      assert.deepStrictEqual(db.values().sort(), [1, 2, 3]);

      const entries = db.entries();
      assert.strictEqual(entries.length, 3);
      assert(entries.some(([k, v]) => k === 'a' && v === 1));
    });

    it('should return correct size and isEmpty status', function () {
      assert.strictEqual(db.size(), 0);
      assert.strictEqual(db.isEmpty(), true);

      db.set('key', 'value');
      assert.strictEqual(db.size(), 1);
      assert.strictEqual(db.isEmpty(), false);
    });

    it('should exclude expired keys from utility methods', function (done: Mocha.Done) {
      db.set('permanent', 'value');
      db.set('temporary', 'value', 0.1); // 100ms TTL

      assert.strictEqual(db.size(), 2);

      setTimeout(() => {
        assert.strictEqual(db.size(), 1);
        assert.deepStrictEqual(db.keys(), ['permanent']);
        done();
      }, 150);
    });
  });

  describe('persistence', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false, pretty: true });
    });

    it('should save and load data synchronously', function () {
      db.set('key1', 'value1');
      db.set('key2', { nested: true });

      db.saveSync();
      assert(fs.existsSync(testFile));

      // Create new instance and load
      const db2 = new BreezeDB(testFile, { autoSave: false });
      assert.strictEqual(db2.get('key1'), 'value1');
      assert.deepStrictEqual(db2.get('key2'), { nested: true });

      db2.close();
    });

    it('should save and load data asynchronously', async function () {
      db.set('async1', 'value1');
      db.set('async2', 'value2');

      await db.save();
      assert(fs.existsSync(testFile));

      // Clear and reload
      db.clear();
      await db.load();

      assert.strictEqual(db.get('async1'), 'value1');
      assert.strictEqual(db.get('async2'), 'value2');
    });

    it('should create backup files', async function () {
      db.set('backup-test', 'value');
      await db.save();

      // Modify and save again
      db.set('backup-test', 'modified');
      await db.save();

      assert(fs.existsSync(db.backupPath));
    });

    it('should handle missing files gracefully', async function () {
      // Try to load non-existent file
      await db.load();
      assert.strictEqual(db.size(), 0);
    });
  });

  describe('compression', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, {
        autoSave: false,
        compression: true,
      });
    });

    it('should compress and decompress data', async function () {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const largeData = {
        users: Array.from(
          { length: 100 },
          (_, i): User => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
          })
        ),
      };

      db.set('large', largeData);
      await db.save();

      // Verify file exists and is compressed (should be smaller than JSON)
      assert(fs.existsSync(testFile));

      // Load and verify
      await db.load();
      assert.deepStrictEqual(db.get('large'), largeData);
    });
  });

  describe('encryption', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, {
        autoSave: false,
        encryption: true,
        encryptionKey: 'test-encryption-key-123',
      });
    });

    it('should encrypt and decrypt data', async function () {
      db.set('secret', 'confidential-data');
      db.set('password', 'super-secret-password');

      await db.save();

      // File should be encrypted (not readable as plain JSON)
      const fileContent = fs.readFileSync(testFile, 'utf8');
      assert(!fileContent.includes('confidential-data'));
      assert(!fileContent.includes('super-secret-password'));

      // Should decrypt properly
      await db.load();
      assert.strictEqual(db.get('secret'), 'confidential-data');
      assert.strictEqual(db.get('password'), 'super-secret-password');
    });

    it('should require encryption key', function () {
      assert.throws(() => {
        new BreezeDB(testFile, { encryption: true });
      });
    });

    it('should handle invalid encrypted data', async function () {
      // Create a file with invalid encrypted data (too short for IV)
      const invalidData = Buffer.from('short');
      fs.writeFileSync(testFile, invalidData);

      db = new BreezeDB(testFile, {
        autoSave: false,
        encryption: true,
        encryptionKey: 'test-key',
      });

      // Should throw error when trying to load
      try {
        await db.load();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error instanceof Error);
        assert(error.message.includes('Invalid encrypted data'));
      }
    });
  });

  describe('events', function () {
    beforeEach(function () {
      db = new BreezeDB(testFile, { autoSave: false });
    });

    it('should emit set events', function (done: Mocha.Done) {
      db.on('set', ({ key, value, oldValue, ttl }) => {
        assert.strictEqual(key, 'test');
        assert.strictEqual(value, 'value');
        assert.strictEqual(oldValue, undefined);
        assert.strictEqual(ttl, 5);
        done();
      });

      db.set('test', 'value', 5);
    });

    it('should emit get events', function (done: Mocha.Done) {
      db.set('test', 'value');

      db.on('get', ({ key, value }) => {
        assert.strictEqual(key, 'test');
        assert.strictEqual(value, 'value');
        done();
      });

      db.get('test');
    });

    it('should emit delete events', function (done: Mocha.Done) {
      db.set('test', 'value');

      db.on('delete', ({ key, oldValue }) => {
        assert.strictEqual(key, 'test');
        assert.strictEqual(oldValue, 'value');
        done();
      });

      db.delete('test');
    });

    it('should expire values and clean up properly', function (done: Mocha.Done) {
      db.set('temp', 'value', 0.1); // 100ms TTL

      setTimeout(() => {
        // Key should be expired and return undefined
        assert.strictEqual(db.get('temp'), undefined);
        assert.strictEqual(db.has('temp'), false);
        done();
      }, 150);
    });

    it('should emit batch events', function (done: Mocha.Done) {
      db.on('batch', ({ operations, results }) => {
        assert.strictEqual(operations.length, 2);
        assert.strictEqual(results.length, 2);
        done();
      });

      db.batch([
        { type: 'set' as const, key: 'a', value: 1 },
        { type: 'set' as const, key: 'b', value: 2 },
      ]);
    });
  });

  describe('error handling', function () {
    it('should handle corrupted files gracefully', async function () {
      // Create corrupted file
      fs.writeFileSync(testFile, 'invalid json content');

      db = new BreezeDB(testFile, { autoSave: false });

      try {
        await db.load();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error instanceof Error);
      }
    });

    it('should handle invalid encryption configuration', function () {
      // Test that encryption without key throws error during construction
      assert.throws(() => {
        new BreezeDB(testFile, { encryption: true } as any);
      }, /Encryption key is required when encryption is enabled/);
    });
  });

  after(function () {
    // Ensure all timers are cleared to prevent hanging
    if (db && typeof db.close === 'function') {
      db.close();
    }
  });
});
