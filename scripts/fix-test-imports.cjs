// One-off: rewrite '@/lib/x' imports in test files to relative './x'
// so tests run without a vitest config/alias (see Sprint 1 report).
const fs = require('fs');
const files = ['compatibility', 'connectionGuards', 'phoneShare', 'roleFiltering', 'sanitizeProfile']
    .map((n) => 'd:/roomate/app/src/lib/' + n + '.test.ts');
for (const f of files) {
    let s = fs.readFileSync(f, 'utf8');
    const before = s;
    s = s.replace(/from '@\/lib\//g, "from './");
    if (s !== before) {
        fs.writeFileSync(f, s);
        console.log('updated', f);
    } else {
        console.log('no change', f);
    }
}