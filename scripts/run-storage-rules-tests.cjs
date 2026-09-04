/**
 * Runs the Storage rules emulator test suite with RUN_STORAGE_RULES_TESTS=1.
 * Invoked inside `firebase emulators:exec` by the root `test:storage-rules` script.
 */
process.env.RUN_STORAGE_RULES_TESTS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const testFile = path.join(__dirname, '..', 'app', 'storage.rules.test.ts');
const result = spawnSync(
    'npx',
    ['-y', 'vitest@4.1.11', 'run', testFile],
    { stdio: 'inherit', shell: true, cwd: path.join(__dirname, '..') }
);
process.exit(result.status == null ? 1 : result.status);