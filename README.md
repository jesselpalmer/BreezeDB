# BreezeDB

A lightweight, feature-rich persistent key-value store with TTL, compression, encryption, and event support.

[![CI](https://github.com/jesselpalmer/BreezeDB/actions/workflows/ci.yml/badge.svg)](https://github.com/jesselpalmer/BreezeDB/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/breezedb.svg)](https://www.npmjs.com/package/breezedb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🚀 **Simple API** - Easy to use key-value operations
- 💾 **Persistent Storage** - Automatic saving to JSON files
- ⏰ **TTL Support** - Set expiration times for keys
- 🗜️ **Compression** - Optional gzip compression
- 🔐 **Encryption** - Optional AES-256-CBC encryption
- 📦 **Batch Operations** - Efficient bulk operations
- 🎯 **Events** - Listen to database operations
- 🔄 **Atomic Writes** - Safe concurrent access
- 💨 **Fast** - In-memory operations with async persistence
- 🛡️ **Backup & Recovery** - Automatic backup files

## Installation

```bash
npm install breezedb
```

## Quick Start

### JavaScript (ES Modules)

```javascript
import BreezeDB from 'breezedb';

// Create a new database
const db = new BreezeDB('./mydata.json');

// Set values
db.set('user:1', { name: 'Alice', age: 30 });
db.set('config', { theme: 'dark', lang: 'en' });

// Get values
const user = db.get('user:1');
console.log(user); // { name: 'Alice', age: 30 }

// Set with expiration (TTL)
db.set('session:abc', { token: 'xyz' }, 3600); // expires in 1 hour

// Delete keys
db.delete('user:1');

// Check existence
if (db.has('config')) {
  console.log('Config exists!');
}

// Get all keys
console.log(db.keys()); // ['config', 'session:abc']

// Database info
console.log('Size:', db.size());
console.log('Empty:', db.isEmpty());
```

### TypeScript

```typescript
import BreezeDB from 'breezedb';
import type { BreezeDBOptions } from 'breezedb';

interface User {
  name: string;
  age: number;
  email?: string;
}

// Type-safe database operations
const db = new BreezeDB('./users.json');

// Set with type inference
db.set<User>('user:1', { name: 'Alice', age: 30 });

// Get with type assertion
const user = db.get<User>('user:1');
if (user) {
  console.log(user.name); // TypeScript knows this is a string
}

// Configuration with types
const options: BreezeDBOptions = {
  compression: true,
  encryption: true,
  encryptionKey: process.env.DB_KEY,
  autoSave: true,
};

const secureDb = new BreezeDB('./secure.json', options);
```

## Advanced Features

### TTL (Time To Live)

```javascript
// Set with TTL (in seconds)
db.set('cache:data', { result: [1, 2, 3] }, 300); // expires in 5 minutes

// Update TTL for existing key
db.setTTL('cache:data', 600); // extend to 10 minutes

// Get remaining TTL
const remaining = db.getTTL('cache:data'); // seconds remaining

// Clear TTL (make permanent)
db.clearTTL('cache:data');
```

### Compression

```javascript
const db = new BreezeDB('./data.json', {
  compression: true, // Enable gzip compression
});

// Automatically compresses large datasets
db.set('big-data', hugeArray);
```

### Encryption

```javascript
const db = new BreezeDB('./secure.json', {
  encryption: true,
  encryptionKey: 'your-secret-key-here',
});

// Data is encrypted at rest
db.set('secret', 'confidential-data');
```

### Batch Operations

```javascript
const operations = [
  { type: 'set', key: 'key1', value: 'value1' },
  { type: 'set', key: 'key2', value: 'value2', ttl: 60 },
  { type: 'delete', key: 'old-key' },
];

const results = db.batch(operations);
console.log(results); // Array of operation results
```

### Events

```javascript
// Listen to database events
db.on('set', ({ key, value, oldValue, ttl }) => {
  console.log(`Set ${key} = ${value}`);
});

db.on('get', ({ key, value }) => {
  console.log(`Got ${key} = ${value}`);
});

db.on('delete', ({ key, oldValue }) => {
  console.log(`Deleted ${key}`);
});

db.on('expired', ({ keys }) => {
  console.log(`Expired keys: ${keys.join(', ')}`);
});

db.on('save', ({ filePath }) => {
  console.log(`Saved to ${filePath}`);
});

db.on('error', error => {
  console.error('Database error:', error);
});
```

### Manual Persistence

```javascript
// Auto-save is enabled by default
const db = new BreezeDB('./data.json', {
  autoSave: false, // Disable auto-save
});

// Save manually (async)
await db.save();

// Save manually (sync)
db.saveSync();

// Load from disk
await db.load();
```

## Configuration Options

```javascript
const db = new BreezeDB('./data.json', {
  // Auto-save settings
  autoSave: true, // Enable auto-save (default: true)
  autoSaveInterval: 5000, // Auto-save interval in ms (default: 5000)

  // TTL settings
  ttlCleanupInterval: 60000, // TTL cleanup interval in ms (default: 60000)

  // Compression
  compression: false, // Enable compression (default: false)

  // Encryption
  encryption: false, // Enable encryption (default: false)
  encryptionKey: null, // Encryption key (required if encryption enabled)

  // Formatting
  pretty: false, // Pretty-print JSON (default: false)
});
```

## API Reference

### Constructor

#### `new BreezeDB(filePath, options)`

- `filePath` (string): Path to the database file
- `options` (object): Configuration options

### Core Methods

#### `set(key, value, ttl?)`

Set a key-value pair with optional TTL in seconds.

#### `get(key)`

Get a value by key. Returns `undefined` if not found or expired.

#### `has(key)`

Check if a key exists and is not expired.

#### `delete(key)`

Delete a key. Returns `true` if the key existed.

#### `clear()`

Remove all keys from the database.

### TTL Methods

#### `setTTL(key, ttl)`

Set TTL for an existing key. Returns `true` if successful.

#### `getTTL(key)`

Get remaining TTL in seconds. Returns `null` if no TTL set.

#### `clearTTL(key)`

Remove TTL from a key. Returns `true` if TTL was cleared.

### Batch Methods

#### `batch(operations)`

Execute multiple operations atomically.

### Utility Methods

#### `keys()`

Get array of all non-expired keys.

#### `values()`

Get array of all non-expired values.

#### `entries()`

Get array of all non-expired [key, value] pairs.

#### `size()`

Get number of non-expired keys.

#### `isEmpty()`

Check if database is empty.

### Persistence Methods

#### `save()`

Save database to disk (async).

#### `saveSync()`

Save database to disk (sync).

#### `load()`

Load database from disk (async).

#### `close()`

Close database and clean up resources.

## Performance

BreezeDB is designed for applications that need:

- Fast read/write operations (in-memory)
- Persistent storage (JSON files)
- Moderate data sizes (up to ~100MB recommended)

For larger datasets or high-concurrency scenarios, consider using a dedicated database server.

## Error Handling

```javascript
// Handle errors with events
db.on('error', error => {
  console.error('Database error:', error);
});

// Or with try-catch for specific operations
try {
  await db.save();
} catch (error) {
  console.error('Save failed:', error);
}
```

## File Recovery

BreezeDB automatically creates backup files:

- `database.json` - Main database file
- `database.json.backup` - Previous version backup
- `database.json.tmp` - Temporary file during writes

If the main file becomes corrupted, BreezeDB will attempt to restore from the backup automatically.

## Examples

See the [examples](./examples/) directory for more usage examples:

- [Basic Usage](./examples/basic.js)
- [Advanced Features](./examples/advanced.js)

## License

MIT © Jesse Palmer

## Contributing

Pull requests are welcome! Please feel free to submit issues and enhancement requests.

## Changelog

### 1.0.0

- Initial release
- Core key-value operations
- TTL support
- Compression and encryption
- Batch operations
- Event system
- Atomic writes and backup recovery
