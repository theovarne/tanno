const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const roots = ['assets/js', 'lib', 'scripts', 'tests'];
let checked = 0;

function visit(relative) {
  const absolute = path.join(root, relative);
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) visit(next);
    else if (/\.(?:cjs|js)$/.test(entry.name)) {
      const source = fs.readFileSync(path.join(root, next), 'utf8');
      if (entry.name.endsWith('.cjs')) {
        const result = spawnSync(process.execPath, ['--check', path.join(root, next)], { encoding: 'utf8' });
        if (result.status !== 0) throw new Error(`${next}: ${result.stderr}`);
      } else {
        esbuild.transformSync(source, { loader: 'js', sourcefile: next, logLevel: 'silent' });
      }
      checked += 1;
    }
  }
}

for (const relative of roots) visit(relative);
console.log(`Syntax checked ${checked} JavaScript files.`);
