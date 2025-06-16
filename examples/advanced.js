import BreezeDB from '../dist/src/index.js';

console.log('=== BreezeDB Advanced Features Example ===\n');

console.log('1. Compression & Encryption:');

// Database with compression and encryption
const secureDB = new BreezeDB('./examples/secure-example.json', {
  compression: true,
  encryption: true,
  encryptionKey: 'my-secret-key-123',
  pretty: false,
  autoSave: false, // Manual save for demo
});

// Add some data
secureDB.set('secret:password', 'super-secret-password');
secureDB.set('secret:api-key', 'abc123xyz789');
secureDB.set('large:data', {
  users: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
  })),
});

console.log('→ Set encrypted data');
console.log('→ Database size:', secureDB.size());

// Save manually to see the file
await secureDB.save();
console.log('✓ Saved compressed & encrypted data to disk');

// Test loading
await secureDB.load();
console.log('✓ Loaded and decrypted data');
console.log('→ Secret password:', secureDB.get('secret:password'));
console.log('→ Large data length:', secureDB.get('large:data').users.length);

console.log('\n2. Events & Monitoring:');

const eventDB = new BreezeDB('./examples/events-example.json');

// Monitor all events
eventDB.on('set', ({ key, _value, ttl }) => {
  console.log(`📝 SET: ${key} ${ttl ? `(TTL: ${ttl}s)` : ''}`);
});

eventDB.on('get', ({ key, value }) => {
  console.log(`📖 GET: ${key} → ${value !== undefined ? 'found' : 'not found'}`);
});

eventDB.on('delete', ({ key, _oldValue }) => {
  console.log(`🗑️  DELETE: ${key}`);
});

eventDB.on('expired', ({ keys }) => {
  console.log(`⏰ EXPIRED: ${keys.join(', ')}`);
});

eventDB.on('batch', ({ operations, _results }) => {
  console.log(`📦 BATCH: ${operations.length} operations`);
});

eventDB.on('error', error => {
  console.error('❌ ERROR:', error.message);
});

// Generate some events
eventDB.set('temp:1', 'value1', 2); // 2 second TTL
eventDB.set('temp:2', 'value2', 3); // 3 second TTL
eventDB.get('temp:1');
eventDB.get('nonexistent');

// Batch operation
eventDB.batch([
  { type: 'set', key: 'batch:a', value: 'A' },
  { type: 'set', key: 'batch:b', value: 'B', ttl: 4 },
  { type: 'delete', key: 'temp:1' },
]);

console.log('\n3. Performance Test:');

const perfDB = new BreezeDB('./examples/perf-example.json', {
  autoSave: false, // Disable auto-save for performance
});

console.time('Write 10,000 records');
for (let i = 0; i < 10000; i++) {
  perfDB.set(`key:${i}`, {
    id: i,
    name: `Item ${i}`,
    timestamp: Date.now(),
    data: Math.random(),
  });
}
console.timeEnd('Write 10,000 records');

console.time('Read 10,000 records');
for (let i = 0; i < 10000; i++) {
  perfDB.get(`key:${i}`);
}
console.timeEnd('Read 10,000 records');

console.time('Save to disk');
await perfDB.save();
console.timeEnd('Save to disk');

console.log('→ Final database size:', perfDB.size());

console.log('\n4. TTL Management:');

const ttlDB = new BreezeDB('./examples/ttl-example.json');

// Set various TTL values
ttlDB.set('short:lived', 'expires soon', 2);
ttlDB.set('medium:lived', 'expires later', 5);
ttlDB.set('permanent', 'never expires');

console.log('Initial TTLs:');
console.log('→ short:lived TTL:', ttlDB.getTTL('short:lived'));
console.log('→ medium:lived TTL:', ttlDB.getTTL('medium:lived'));
console.log('→ permanent TTL:', ttlDB.getTTL('permanent'));

// Update TTL
ttlDB.setTTL('permanent', 8);
console.log('→ permanent TTL (after setting):', ttlDB.getTTL('permanent'));

// Clear TTL
ttlDB.clearTTL('medium:lived');
console.log('→ medium:lived TTL (after clearing):', ttlDB.getTTL('medium:lived'));

console.log('\n5. Cleanup after 6 seconds...');
setTimeout(async () => {
  console.log('\nFinal states:');
  console.log('→ Event DB keys:', eventDB.keys());
  console.log('→ TTL DB keys:', ttlDB.keys());

  // Cleanup
  secureDB.close();
  eventDB.close();
  perfDB.close();
  ttlDB.close();

  console.log('\n✅ All examples completed!');
}, 6000);
