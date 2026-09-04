/**
 * Runs the Firestore rules emulator test suite with RUN_RULES_TESTS=1.
 * Invoked inside `firebase emulators:exec` by the root `test:rules` script.
 * Path-independent: resolves the test file relative to this script's location,
 * so it works whether emulators:exec runs from the repo root or app/.
 */
process.env.RUN_RULES_TESTS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const testFile = path.join(__dirname, '..', 'app', 'firestore.rules.test.ts');
const result = spawnSync(
    'npx',
    ['-y', 'vitest@4.1.11', 'run', testFile],
    { stdio: 'inherit', shell: true, cwd: path.join(__dirname, '..') }
);
process.exit(result.status == null ? 1 : result.status);