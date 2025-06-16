import BreezeDB from '../dist/src/index.js';

console.log('=== BreezeDB Basic Example ===\n');

// Create a new database instance
const db = new BreezeDB('./examples/basic-example.json', {
  pretty: true,
  autoSave: true,
});

// Listen to events
db.on('set', ({ key, value }) => console.log(`✓ Set: ${key} = ${JSON.stringify(value)}`));
db.on('get', ({ key, value }) => console.log(`→ Get: ${key} = ${JSON.stringify(value)}`));
db.on('delete', ({ key }) => console.log(`✗ Deleted: ${key}`));
db.on('save', () => console.log('💾 Data saved to disk'));

console.log('1. Basic Operations:');

// Set some values
db.set('user:1', { name: 'Alice', age: 30 });
db.set('user:2', { name: 'Bob', age: 25 });
db.set('config:theme', 'dark');
db.set('config:lang', 'en');

// Get values
console.log('→ Get user:1:', db.get('user:1'));
console.log('→ Get config:theme:', db.get('config:theme'));

console.log('\n2. TTL (Time To Live):');

// Set values with expiration
db.set('session:abc123', { userId: 1, token: 'xyz' }, 3); // expires in 3 seconds
db.set('cache:data', { result: [1, 2, 3] }, 5); // expires in 5 seconds

console.log('→ Session (just set):', db.get('session:abc123'));
console.log('→ TTL remaining:', db.getTTL('session:abc123'), 'seconds');

// Wait and check expiration
setTimeout(() => {
  console.log('\nAfter 4 seconds:');
  console.log('→ Session (should be expired):', db.get('session:abc123'));
  console.log('→ Cache (should still exist):', db.get('cache:data'));
  console.log('→ Cache TTL remaining:', db.getTTL('cache:data'), 'seconds');
}, 4000);

console.log('\n3. Batch Operations:');

const batchOps = [
  { type: 'set', key: 'batch:1', value: 'first' },
  { type: 'set', key: 'batch:2', value: 'second', ttl: 10 },
  { type: 'set', key: 'batch:3', value: 'third' },
  { type: 'delete', key: 'config:lang' },
];

const results = db.batch(batchOps);
console.log('Batch results:', results);

console.log('\n4. Database Info:');
console.log('→ Total keys:', db.size());
console.log('→ All keys:', db.keys());
console.log('→ Has user:1:', db.has('user:1'));
console.log('→ Has nonexistent:', db.has('nonexistent'));

// Save manually
console.log('\n5. Manual Save:');
await db.save();

console.log('\n6. Cleanup after 6 seconds...');
setTimeout(() => {
  console.log('\nFinal state:');
  console.log('→ All remaining keys:', db.keys());
  console.log('→ Database size:', db.size());

  // Clean up
  db.close();
}, 6000);
