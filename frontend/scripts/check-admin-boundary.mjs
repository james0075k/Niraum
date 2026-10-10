// Fails if public code imports the admin app (only router.tsx may, lazily).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const bad = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(root, p).split(sep).join('/');
    if (rel === 'admin' || rel === 'app/router.tsx') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name) && readFileSync(p, 'utf8').includes('@/admin'))
      bad.push(rel);
  }
})(root);
if (bad.length) {
  console.error(`Public code imports @/admin:\n${bad.join('\n')}`);
  process.exit(1);
}
