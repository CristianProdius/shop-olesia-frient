const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'tiktok-products');

const cats = JSON.parse(fs.readFileSync(path.join(DIR, '_categories.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const byProd = {};
for (const m of manifest) byProd[m.product] = m;

const csvEsc = (v) => {
  v = String(v == null ? '' : v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

// Dress length facet: derive Maxi/Midi/Mini from text, with manual overrides for ambiguous ones.
const lengthOverride = {
  '032': 'Midi', '033': 'Midi', '036': 'Midi', '045': 'Maxi', '053': 'Midi',
  '077': 'Maxi', '080': 'Midi', '081': 'Midi', '105': 'Mini',
};
function dressLength(c) {
  if (c.category !== 'Dresses') return '';
  if (lengthOverride[c.product]) return lengthOverride[c.product];
  const s = (c.subcategory + ' ' + c.title).toLowerCase();
  if (/maxi/.test(s)) return 'Maxi';
  if (/midi/.test(s)) return 'Midi';
  if (/\bmini\b/.test(s)) return 'Mini';
  return '';
}

const rows = [];
const header = ['product', 'title', 'category', 'subcategory', 'dress_length', 'color', 'pattern', 'tags', 'views', 'video_url', 'image1', 'image2', 'image3'];
rows.push(header.join(','));

const full = [];
for (const c of cats) {
  const m = byProd[c.product] || {};
  const imgs = (m.images || '').split('|');
  const rec = {
    product: c.product,
    title: c.title,
    category: c.category,
    subcategory: c.subcategory,
    dress_length: dressLength(c),
    color: c.color,
    pattern: c.pattern,
    tags: c.tags,
    views: m.views || 0,
    video_url: m.video || '',
    image1: imgs[0] || `product-${c.product}-1.jpg`,
    image2: imgs[1] || `product-${c.product}-2.jpg`,
    image3: imgs[2] || `product-${c.product}-3.jpg`,
  };
  full.push(rec);
  rows.push([
    rec.product, csvEsc(rec.title), rec.category, csvEsc(rec.subcategory), rec.dress_length, rec.color,
    rec.pattern, csvEsc(rec.tags.join('; ')), rec.views, rec.video_url,
    rec.image1, rec.image2, rec.image3,
  ].join(','));
}

fs.writeFileSync(path.join(DIR, 'catalog.csv'), rows.join('\n') + '\n');
fs.writeFileSync(path.join(DIR, 'catalog.json'), JSON.stringify(full, null, 2));

// summary
const byCat = {};
for (const r of full) byCat[r.category] = (byCat[r.category] || 0) + 1;
console.log('Wrote catalog.csv and catalog.json (' + full.length + ' products)\n');
console.log('Category breakdown:');
Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(3) + '  ' + k));

const byLen = {};
for (const r of full) if (r.category === 'Dresses') byLen[r.dress_length || '(unset)'] = (byLen[r.dress_length || '(unset)'] || 0) + 1;
console.log('\nDress length breakdown (81 dresses):');
Object.entries(byLen).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(3) + '  ' + k));
