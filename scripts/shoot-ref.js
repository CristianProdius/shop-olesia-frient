const PW = '/Users/cristian/.nvm/versions/node/v22.21.1/lib/node_modules/playwright/index.js';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'design-ref');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', 'https://barbaracollection.com/en'],
  ['new-in', 'https://barbaracollection.com/en/collections/new-in'],
  ['dresses', 'https://barbaracollection.com/en/collections/dresses'],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const [name, url] of PAGES) {
    for (const [dev, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(3500);
        // dismiss cookie/newsletter popups generically
        for (const t of ['accept', 'agree', 'got it', 'close', '×']) {
          const b = page.locator(`button:has-text("${t}")`).first();
          if (await b.count().catch(() => 0)) { await b.click({ timeout: 1500 }).catch(() => {}); }
        }
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(800);
        // viewport shot (above the fold) + capped full page
        await page.screenshot({ path: path.join(OUT, `${name}-${dev}-fold.jpg`), quality: 75, type: 'jpeg' });
        await page.screenshot({ path: path.join(OUT, `${name}-${dev}-full.jpg`), quality: 65, type: 'jpeg', fullPage: true });
        console.log(`shot ${name} ${dev}`);
      } catch (e) { console.log(`FAIL ${name} ${dev}: ${e.message}`); }
      await ctx.close();
    }
  }
  // grab computed design tokens from home
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://barbaracollection.com/en', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const tokens = await page.evaluate(() => {
    const out = { fonts: new Set(), colors: {}, headings: {} };
    const all = document.querySelectorAll('*');
    const colorCount = {};
    for (const el of all) {
      const cs = getComputedStyle(el);
      out.fonts.add(cs.fontFamily);
      const c = cs.color, bg = cs.backgroundColor;
      colorCount[c] = (colorCount[c] || 0) + 1;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') colorCount[bg] = (colorCount[bg] || 0) + 1;
    }
    for (const tag of ['h1', 'h2', 'h3', 'a', 'p', 'button']) {
      const el = document.querySelector(tag);
      if (el) { const cs = getComputedStyle(el); out.headings[tag] = { font: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight, spacing: cs.letterSpacing, transform: cs.textTransform, lineHeight: cs.lineHeight }; }
    }
    out.fonts = [...out.fonts].slice(0, 12);
    out.colors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 16);
    return out;
  });
  fs.writeFileSync(path.join(OUT, 'tokens.json'), JSON.stringify(tokens, null, 2));
  console.log('tokens captured');
  await browser.close();
})();
