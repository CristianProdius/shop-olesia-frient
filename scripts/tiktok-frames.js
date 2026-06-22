// Scrape ALL videos from @liletti_md, capture 3 frames per video (at ~15/45/75% of duration),
// save as tiktok-products/product-XXX-N.jpg ordered by views desc, plus manifest.csv/json.
// Resumable: rerun to continue after a captcha interruption (skips finished products).
const PW = '/Users/cristian/.nvm/versions/node/v22.21.1/lib/node_modules/playwright/index.js';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');

const PROFILE = 'https://www.tiktok.com/@liletti_md';
const OUT = path.join(__dirname, '..', 'tiktok-products');
const FRAMES_AT = [0.15, 0.45, 0.75]; // fractions of video duration
fs.mkdirSync(OUT, { recursive: true });

function parseViews(s) {
  if (!s) return 0;
  s = String(s).trim().toUpperCase();
  const m = s.match(/^([\d.]+)\s*([KMB]?)$/);
  if (!m) return parseInt(s.replace(/\D/g, '')) || 0;
  let n = parseFloat(m[1]);
  if (m[2] === 'K') n *= 1e3; else if (m[2] === 'M') n *= 1e6; else if (m[2] === 'B') n *= 1e9;
  return Math.round(n);
}

async function waitForGrid(page, sel, label) {
  console.log(`>>> Waiting for ${label}. Solve any CAPTCHA in the window now (up to 4 min)...`);
  for (let t = 0; t < 48; t++) {
    const c = await page.locator(sel).count().catch(() => 0);
    if (c > 0) return true;
    await page.waitForTimeout(5000);
    if (t % 3 === 0) console.log(`   ...waiting (${t * 5}s)`);
  }
  return false;
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

  // ---- Phase 1: collect all videos from the profile grid ----
  console.log('Loading profile...');
  await page.goto(PROFILE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  const gridSel = '[data-e2e="user-post-item"]';
  if (!(await waitForGrid(page, gridSel, 'profile grid'))) {
    console.log('Grid never appeared.'); await browser.close(); process.exit(2);
  }
  console.log('Grid detected. Scrolling to load all videos...');
  let prev = 0, stable = 0;
  for (let i = 0; i < 100; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1400);
    const c = await page.locator(gridSel).count();
    if (c === prev) { if (++stable >= 4) break; } else stable = 0;
    prev = c;
    if (i % 5 === 0) console.log(`   scroll ${i}: ${c} videos`);
  }
  let items = await page.$$eval(gridSel, (els) =>
    els.map((el) => {
      const a = el.querySelector('a[href*="/video/"]');
      const v = el.querySelector('[data-e2e="video-views"]');
      return { href: a ? a.href : null, viewsText: v ? v.textContent : '0' };
    })
  );
  items = items.filter((x) => x.href).map((x) => ({ ...x, views: parseViews(x.viewsText) }));
  // de-dup by href, sort by views desc
  const seen = new Set();
  items = items.filter((x) => (seen.has(x.href) ? false : (seen.add(x.href), true)));
  items.sort((a, b) => b.views - a.views);
  console.log(`Collected ${items.length} unique videos. Capturing ${FRAMES_AT.length} frames each.`);
  fs.writeFileSync(path.join(OUT, '_videos.json'), JSON.stringify(items, null, 2));

  // ---- Phase 2: per-video frame capture ----
  const manifest = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const num = String(i + 1).padStart(3, '0');
    const files = FRAMES_AT.map((_, k) => `product-${num}-${k + 1}.jpg`);
    const done = files.every((f) => fs.existsSync(path.join(OUT, f)));
    const row = { product: num, views: it.views, viewsText: it.viewsText, video: it.href, images: files.join('|') };
    if (done) { console.log(`[${num}] already done, skipping`); manifest.push(row); continue; }

    try {
      await page.goto(it.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // wait for a playable video element
      let ok = false;
      for (let t = 0; t < 24; t++) {
        const has = await page.evaluate(() => {
          const v = document.querySelector('video');
          return !!(v && v.readyState >= 2 && v.videoWidth > 0 && isFinite(v.duration) && v.duration > 0);
        }).catch(() => false);
        if (has) { ok = true; break; }
        // captcha guard
        const cap = await page.locator('text=/puzzle|slider/i').count().catch(() => 0);
        if (cap) console.log(`   [${num}] captcha? solve it in the window...`);
        await page.waitForTimeout(2500);
      }
      if (!ok) { console.log(`[${num}] no playable video, skipping`); continue; }

      const dur = await page.evaluate(() => document.querySelector('video').duration);
      let savedCount = 0;
      for (let k = 0; k < FRAMES_AT.length; k++) {
        const t = Math.max(0.1, Math.min(dur - 0.1, dur * FRAMES_AT[k]));
        const dataUrl = await page.evaluate(async (target) => {
          const v = document.querySelector('video');
          v.pause();
          await new Promise((res) => {
            const onSeek = () => { v.removeEventListener('seeked', onSeek); res(); };
            v.addEventListener('seeked', onSeek);
            v.currentTime = target;
            setTimeout(res, 4000); // safety timeout
          });
          await new Promise((r) => setTimeout(r, 250));
          const c = document.createElement('canvas');
          c.width = v.videoWidth; c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          try { return c.toDataURL('image/jpeg', 0.92); }
          catch (e) { return 'TAINTED'; }
        }, t);

        if (dataUrl === 'TAINTED') {
          // fallback: screenshot the video element bounding box
          const vh = await page.$('video');
          if (vh) { await vh.screenshot({ path: path.join(OUT, files[k]) }); savedCount++; }
          else console.log(`   [${num}] frame ${k + 1} tainted + no element`);
        } else if (dataUrl && dataUrl.startsWith('data:image')) {
          const b64 = dataUrl.split(',')[1];
          fs.writeFileSync(path.join(OUT, files[k]), Buffer.from(b64, 'base64'));
          savedCount++;
        }
      }
      console.log(`[${num}] ${it.viewsText} views — saved ${savedCount}/${FRAMES_AT.length} frames (dur ${dur.toFixed(1)}s)`);
      manifest.push(row);
    } catch (e) {
      console.log(`[${num}] ERROR: ${e.message}`);
    }
  }

  // ---- manifest ----
  const csv = ['product,views,video_url,image1,image2,image3'];
  for (const r of manifest) {
    const imgs = r.images.split('|');
    csv.push(`${r.product},${r.views},${r.video},${imgs[0] || ''},${imgs[1] || ''},${imgs[2] || ''}`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.csv'), csv.join('\n'));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.length} products. Manifest written.`);
  await browser.close();
})();
