# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-15

### Added

- **Core Features**

  - Key-value storage with persistent JSON files
  - TTL (Time To Live) support with automatic expiration
  - Optional gzip compression for storage efficiency
  - Optional AES-256-CBC encryption for data security
  - Batch operations for efficient bulk operations
  - Event system for monitoring database operations
  - Atomic writes with backup and recovery

- **TypeScript Support**

  - Full TypeScript implementation
  - Complete type definitions
  - Generic support for type-safe operations
  - Exported utility types and interfaces

- **Developer Experience**

  - Comprehensive documentation with examples
  - ESLint and Prettier configuration
  - Pre-commit hooks with Husky and lint-staged
  - GitHub Actions CI/CD pipeline
  - Multiple Node.js version testing (18, 20, 22)

- **API Methods**

  - `set(key, value, ttl?)` - Set key-value pairs with optional TTL
  - `get(key)` - Retrieve values by key
  - `has(key)` - Check key existence
  - `delete(key)` - Remove keys
  - `clear()` - Clear all data
  - `keys()`, `values()`, `entries()` - Iteration methods
  - `size()`, `isEmpty()` - Utility methods
  - `setTTL()`, `getTTL()`, `clearTTL()` - TTL management
  - `batch()` - Batch operations
  - `save()`, `saveSync()`, `load()` - Persistence control
  - `close()` - Resource cleanup

- **Configuration Options**

  - `autoSave` - Automatic saving to disk
  - `autoSaveInterval` - Save frequency control
  - `compression` - Enable gzip compression
  - `encryption` - Enable AES encryption
  - `encryptionKey` - Encryption key specification
  - `pretty` - Pretty-print JSON output

- **Event System**
  - `set`, `get`, `delete` events for data operations
  - `expired` event for TTL expiration notifications
  - `batch` event for bulk operation completion
  - `clear` event for database clearing
  - `save`, `load` events for persistence operations
  - `ttl-set`, `ttl-cleared` events for TTL management
  - `error` event for error handling

### Technical Details

- **Architecture**: Modular design with separated concerns
- **Storage**: JSON-based with optional compression and encryption
- **Performance**: In-memory operations with configurable persistence
- **Reliability**: Atomic writes, backup files, and error recovery
- **Compatibility**: ES modules, Node.js 14+, TypeScript 5+

### Examples

- Basic usage examples in `/examples/basic.js`
- Advanced features demonstration in `/examples/advanced.js`
- TypeScript usage examples in README

[1.0.0]: https://github.com/jesselpalmer/BreezeDB/releases/tag/v1.0.0
