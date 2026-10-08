/**
 * CLI Runner for Test Universe Reset
 * Usage: node tests/seed/run-reset.cjs
 */
const fs = require('fs');
const path = require('path');
const { assertTestEnvironment, PROTECTED_ACCOUNTS } = require('../helpers/environmentGuard.cjs');

// Enforce production safety check first
const envCheck = assertTestEnvironment('test:reset');

const dataDir = path.resolve(__dirname, '../data');
const universeFile = path.join(dataDir, 'seed-universe.json');
const authDir = path.resolve(__dirname, '../.auth');

console.log('======================================================');
console.log('🧹 NESTMATE TEST UNIVERSE RESET INITIATED');
console.log('======================================================');
console.log(`Environment: ${envCheck.nodeEnv} (isolated: ${envCheck.isolated})`);

if (fs.existsSync(universeFile)) {
  fs.unlinkSync(universeFile);
  console.log('✓ Cleared tests/data/seed-universe.json');
} else {
  console.log('✓ No active seed-universe.json found. Clean state verified.');
}

if (fs.existsSync(authDir)) {
  const files = fs.readdirSync(authDir);
  files.forEach(f => {
    if (f.endsWith('.json')) {
      fs.unlinkSync(path.join(authDir, f));
    }
  });
  console.log(`✓ Cleared ${files.length} authentication states in tests/.auth`);
}

console.log('\nProtected User Accounts Preserved (Strict Zero-Touch Guard):');
PROTECTED_ACCOUNTS.forEach(acc => console.log(`  - ${acc} (IMMUTABLE)`));

console.log('\n======================================================');
console.log('✅ TEST UNIVERSE RESET COMPLETE');
console.log('======================================================');
