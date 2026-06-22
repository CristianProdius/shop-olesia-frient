// Scrape @liletti_md TikTok profile: collect every video's cover (first frame) + view count,
// sort by views, take top 50, download covers into tiktok-products/.
const PW = '/Users/cristian/.nvm/versions/node/v22.21.1/lib/node_modules/playwright/index.js';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');

const PROFILE = 'https://www.tiktok.com/@liletti_md';
const OUT = path.join(__dirname, '..', 'tiktok-products');
const TARGET = 50;

function parseViews(s) {
  if (!s) return 0;
  s = s.trim().toUpperCase();
  const m = s.match(/^([\d.]+)\s*([KMB]?)$/);
  if (!m) return parseInt(s.replace(/\D/g, '')) || 0;
  let n = parseFloat(m[1]);
  if (m[2] === 'K') n *= 1e3;
  else if (m[2] === 'M') n *= 1e6;
  else if (m[2] === 'B') n *= 1e9;
  return Math.round(n);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1800 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  console.log('Loading profile...');
  await page.goto(PROFILE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Detect captcha / login wall
  const title = await page.title();
  const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
  console.log('Page title:', title);

  // Wait for the video grid. If a captcha is shown, the user solves it in the visible window.
  const sel = '[data-e2e="user-post-item"]';
  let hasGrid = false;
  console.log('\n>>> If a slider/puzzle CAPTCHA appears in the browser window, solve it now.');
  console.log('>>> Waiting up to 4 minutes for the video grid to appear...\n');
  for (let t = 0; t < 48; t++) {
    const c = await page.locator(sel).count().catch(() => 0);
    if (c > 0) { hasGrid = true; break; }
    await page.waitForTimeout(5000);
    if (t % 3 === 0) console.log(`  ...still waiting for grid (${t * 5}s)`);
  }

  if (!hasGrid) {
    fs.writeFileSync(path.join(OUT, '_debug.txt'), bodyText);
    await page.screenshot({ path: path.join(OUT, '_debug.png'), fullPage: false });
    console.log('Grid never appeared (captcha not solved in time). Saved _debug.png');
    await browser.close();
    process.exit(2);
  }
  console.log('Grid detected — collecting videos.');

  // Scroll to load all videos
  let prevCount = 0,
    stable = 0;
  for (let i = 0; i < 80; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1500);
    const count = await page.locator(sel).count();
    if (count === prevCount) {
      stable++;
      if (stable >= 4) break;
    } else stable = 0;
    prevCount = count;
    if (i % 5 === 0) console.log(`scroll ${i}: ${count} videos loaded`);
  }
  const finalCount = await page.locator(sel).count();
  console.log('Total videos loaded:', finalCount);

  // Extract data per video
  const items = await page.$$eval(sel, (els) =>
    els.map((el) => {
      const a = el.querySelector('a[href*="/video/"]');
      const img = el.querySelector('img');
      const viewsEl = el.querySelector('[data-e2e="video-views"]');
      return {
        href: a ? a.href : null,
        cover: img ? img.getAttribute('src') : null,
        viewsText: viewsEl ? viewsEl.textContent : '0',
      };
    })
  );

  const enriched = items
    .filter((x) => x.cover && x.href)
    .map((x) => ({ ...x, views: 0 }));
  // parse views in node
  for (const it of enriched) it.views = (function (s) {
    if (!s) return 0;
    s = s.trim().toUpperCase();
    const m = s.match(/^([\d.]+)\s*([KMB]?)$/);
    if (!m) return parseInt(s.replace(/\D/g, '')) || 0;
    let n = parseFloat(m[1]);
    if (m[2] === 'K') n *= 1e3; else if (m[2] === 'M') n *= 1e6; else if (m[2] === 'B') n *= 1e9;
    return Math.round(n);
  })(it.viewsText);

  enriched.sort((a, b) => b.views - a.views);
  const top = enriched.slice(0, TARGET);
  console.log(`Selected top ${top.length} by views (max ${top[0]?.views}, min ${top[top.length-1]?.views})`);

  // Download covers via page context (avoids hotlink/CORS issues)
  const manifest = [];
  for (let i = 0; i < top.length; i++) {
    const it = top[i];
    const idx = String(i + 1).padStart(2, '0');
    const fname = `product-${idx}-${it.views}views.jpg`;
    try {
      const buf = await page.evaluate(async (url) => {
        const r = await fetch(url);
        const b = await r.arrayBuffer();
        return Array.from(new Uint8Array(b));
      }, it.cover);
      fs.writeFileSync(path.join(OUT, fname), Buffer.from(buf));
      manifest.push({ rank: i + 1, file: fname, views: it.views, viewsText: it.viewsText, video: it.href, cover: it.cover });
      console.log(`saved ${fname} (${it.viewsText} views)`);
    } catch (e) {
      console.log(`FAILED ${fname}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Done. ${manifest.length} covers saved to tiktok-products/`);
  await browser.close();
})();
