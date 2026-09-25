const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', 'dist', 'qa', 'test-results', '.vercel']);
const sourceExtensions = new Set(['.html', '.js', '.cjs', '.json', '.css', '.md']);

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    if (excluded.has(item.name)) return [];
    const absolute = path.join(directory, item.name);
    return item.isDirectory() ? sourceFiles(absolute) : sourceExtensions.has(path.extname(item.name)) ? [absolute] : [];
  });
}

test('site source, metadata, labels, messages, and CSS content contain no CJK text', () => {
  for (const file of sourceFiles(root)) {
    const contents = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(contents, /[\u3400-\u9fff\u3040-\u30ff]/, path.relative(root, file));
  }
});
