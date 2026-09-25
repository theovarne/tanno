const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const asset = fs.readFileSync(path.join(root, 'assets/images/sevra/amber-ghost.png'));
const output = path.join(root, 'docs/assets/github-social-preview.png');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><head><style>
      * { box-sizing: border-box; }
      body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #050402; color: #e8e1d5; font-family: 'Courier New', Courier, monospace; }
      .frame { position: absolute; inset: 34px; border: 1px solid #3b280e; }
      .eyebrow { position: absolute; top: 55px; left: 74px; color: #cc790d; font-size: 13px; letter-spacing: .16em; }
      .rule { position: absolute; left: 74px; right: 74px; top: 101px; border-top: 1px solid #35220c; }
      .name { position: absolute; left: 74px; top: 179px; font: 700 94px Arial, sans-serif; letter-spacing: -.085em; color: #f3ede5; }
      .line { position: absolute; left: 80px; top: 327px; color: #f5a019; font-size: 26px; font-weight: bold; letter-spacing: .04em; }
      .sub { position: absolute; left: 80px; top: 377px; color: #a79c8b; font-size: 18px; }
      .footer { position: absolute; left: 80px; bottom: 79px; color: #6e6559; font-size: 13px; letter-spacing: .13em; }
      img { position: absolute; right: 105px; top: 160px; width: 328px; height: 328px; image-rendering: pixelated; object-fit: contain; }
    </style></head><body>
      <div class="frame"></div><div class="eyebrow">TANNO.SYSTEM / LIFE SPECIMEN</div><div class="rule"></div>
      <div class="name">tanno</div><div class="line">ONE BILLION COMPUTED LIVES.</div>
      <div class="sub">same number. same life.</div><div class="footer">RESEARCH ARCHIVE · PRE-LAUNCH</div>
      <img alt="" src="data:image/png;base64,${asset.toString('base64')}">
    </body></html>`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output });
    console.log(output);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
