const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const diary = html.match(/<div class="diary">([\s\S]*?)\n  <\/div>\n  <div class="earn">/);
if (!diary) throw new Error('Original diary block not found');
const entries = [...diary[1].matchAll(/<div class="e"><div class="d">([\s\S]*?)<\/div>\s*<p>([\s\S]*?)<\/p><\/div>/g)]
  .map((match) => ({ title: match[1].trim(), bodyHtml: match[2].trim() }));
if (entries.length !== 6) throw new Error(`Expected six original entries; found ${entries.length}`);
fs.writeFileSync(path.join(root, 'data', 'diary.json'), `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Extracted ${entries.length} original diary entries`);
