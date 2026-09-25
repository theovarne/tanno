const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace('\n+  <a href="#token">tokenomics</a>.</p>', '\n  <a href="#token">tokenomics</a>.</p>');
html = html.replace('<tr><th>ticker</th><td class="mono">TBA</td></tr>', '<tr><th>ticker</th><td class="mono" id="contract-symbol">TBA</td></tr>');
html = html.replace('      <tr><th>symbol</th><td class="mono" id="contract-symbol">TBA</td></tr>\n', '');
html = html.replace('there are only eight billion living humans. i am a planned census of digital life at an absurd scale.', 'i am a planned census of digital life at an absurd scale.');
html = html.replace('this is the same logic the <a href="#demo">viewer above</a>\n  runs live in your browser — type any number and you get exactly what everyone else\n  gets for that number. that is the whole promise: a life you can recompute, and no one\n  can fake.',
  'the <a href="#demo">viewer above</a> runs the published local engine. type the same\n  number twice and you get the same life. custody and mortality require separate records.');
fs.writeFileSync(file, html);

const buildFile = path.resolve(__dirname, 'build.cjs');
let build = fs.readFileSync(buildFile, 'utf8');
build = build.replace('fs.rmSync(out, { recursive: true, force: true });',
  "if (!out.startsWith(`${root}${path.sep}`) || path.basename(out) !== 'dist') throw new Error('Unsafe output path');\nfs.rmSync(out, { recursive: true, force: true });");
build = build.replace("fs.mkdirSync(path.join(out, 'assets', 'js'), { recursive: true });",
  "fs.mkdirSync(path.join(out, 'assets', 'js'), { recursive: true });\nfs.mkdirSync(path.join(out, 'assets', 'css'), { recursive: true });");
fs.writeFileSync(buildFile, build);
console.log('Cleaned source and verified build target');
