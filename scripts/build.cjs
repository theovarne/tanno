const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
if (!out.startsWith(`${root}${path.sep}`) || path.basename(out) !== 'dist') throw new Error('Unsafe output path');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets', 'js'), { recursive: true });
fs.mkdirSync(path.join(out, 'assets', 'css'), { recursive: true });
fs.cpSync(path.join(root, 'assets', 'images'), path.join(out, 'assets', 'images'), { recursive: true });
fs.cpSync(path.join(root, 'config'), path.join(out, 'config'), { recursive: true });
fs.cpSync(path.join(root, 'data'), path.join(out, 'data'), { recursive: true });
const galleryDir = path.join(root, 'assets', 'images', 'sevra', 'gallery');
const gallery = fs.existsSync(galleryDir)
  ? fs.readdirSync(galleryDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((name) => `./assets/images/sevra/gallery/${encodeURIComponent(name)}`)
  : [];
fs.writeFileSync(path.join(out, 'data', 'sevra-gallery.json'), JSON.stringify(gallery));
const sourceHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const diary = JSON.parse(fs.readFileSync(path.join(root, 'data', 'diary.json'), 'utf8'));
const diaryHtml = diary.map((entry) => {
  const time = entry.recordedAt && !Number.isNaN(Date.parse(entry.recordedAt)) ? ` data-recorded-at="${new Date(entry.recordedAt).toISOString()}"` : '';
  return `    <div class="e"${time}><div class="d">${entry.title}</div><p>${entry.bodyHtml}</p></div>`;
}).join('\n\n');
const renderedHtml = sourceHtml.replace(/<div class="diary">[\s\S]*?\n  <\/div>\n  <div class="earn">/, `<div class="diary">\n${diaryHtml}\n  </div>\n  <div class="earn">`);
if (renderedHtml === sourceHtml) throw new Error('Diary render target not found');
const imagePlaceholder = '<script id="specimen-images" type="application/json">[]</script>';
if (!renderedHtml.includes(imagePlaceholder)) throw new Error('Specimen image placeholder not found');
const embeddedImages = JSON.stringify(gallery).replace(/</g, String.fromCharCode(92) + 'u003c');
fs.writeFileSync(path.join(out, 'index.html'), renderedHtml.replace(imagePlaceholder,
  `<script id="specimen-images" type="application/json">${embeddedImages}</script>`));
fs.copyFileSync(path.join(root, 'assets', 'css', 'product.css'), path.join(out, 'assets', 'css', 'product.css'));
fs.copyFileSync(path.join(root, 'assets', 'css', 'archive.css'), path.join(out, 'assets', 'css', 'archive.css'));
fs.copyFileSync(path.join(root, 'assets', 'css', 'sevra-gallery.css'), path.join(out, 'assets', 'css', 'sevra-gallery.css'));
fs.copyFileSync(path.join(root, 'assets', 'css', 'amber-theme.css'), path.join(out, 'assets', 'css', 'amber-theme.css'));
const engineSource = fs.readFileSync(path.join(root, 'assets', 'js', 'engine.js'), 'utf8');
const lifeSource = fs.readFileSync(path.join(root, 'lib', 'life-engine.cjs'), 'utf8');
const burnSource = fs.readFileSync(path.join(root, 'assets', 'js', 'burn.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
const raritySource = engineSource.slice(engineSource.indexOf('  function isPalindrome'), engineSource.indexOf('  // ---- traits'));
const graveyardSource = appSource.slice(appSource.indexOf('function renderHeadstones'), appSource.indexOf('function initBurn'));
if (!raritySource || !graveyardSource) throw new Error('Source excerpts not found');
fs.writeFileSync(path.join(out, 'data', 'code.json'), JSON.stringify({
  ENGINE: '// assets/js/engine.js\n' + engineSource + '\n// lib/life-engine.cjs\n' + lifeSource,
  RARITY: '// assets/js/engine.js / exact rarity excerpt\n' + raritySource,
  MORTALITY: '// assets/js/burn.js\n' + burnSource + '\n// assets/js/app.js / graveyard excerpt\n' + graveyardSource,
  TYPES: '// lib/life-engine.cjs / returned life record\n' + lifeSource,
  files: { ENGINE: 'ENGINE.JS + LIFE-ENGINE.CJS', RARITY: 'ENGINE.JS / RARITY', MORTALITY: 'BURN.JS + APP.JS', TYPES: 'LIFE-ENGINE.CJS' },
}));

Promise.all([
  esbuild.build({
    entryPoints: [path.join(root, 'assets', 'js', 'app.js')],
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    outfile: path.join(out, 'assets', 'js', 'app.js'),
  }),
  esbuild.build({
    entryPoints: [path.join(root, 'assets', 'js', 'archive.js')],
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    outfile: path.join(out, 'assets', 'js', 'archive.js'),
  }),
  esbuild.build({
    entryPoints: [path.join(root, 'assets', 'js', 'burn.js')],
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    format: 'esm',
    target: ['es2020'],
    outfile: path.join(out, 'assets', 'js', 'burn.js'),
    inject: [path.join(root, 'scripts', 'buffer-shim.js')],
    define: { global: 'globalThis' },
  }),
]).then(() => console.log('TANNO archive built')).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});





