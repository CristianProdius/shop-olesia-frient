// Applies RU/RO translations from tiktok-products/content-translations.json
// into the i18n JSON columns (Product.nameI18n, Category.nameI18n, Size.nameI18n,
// Color.nameI18n, Billboard.labelI18n). English stays as the existing column value.
//
//   node --env-file=.env scripts/translate-content.mjs
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "..");
const T = JSON.parse(readFileSync(path.join(ROOT, "tiktok-products", "content-translations.json"), "utf8"));
const prisma = new PrismaClient();

const i18n = (en, tr) => (tr ? { en, ru: tr.ru, ro: tr.ro } : { en });

async function main() {
  let stats = { products: 0, categories: 0, sizes: 0, colors: 0, billboards: 0, missing: [] };

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  for (const p of products) {
    const tr = T.products[p.name];
    if (!tr) { stats.missing.push(p.name); continue; }
    await prisma.product.update({ where: { id: p.id }, data: { nameI18n: i18n(p.name, tr) } });
    stats.products++;
  }

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  for (const c of categories) {
    const tr = T.categories[c.name];
    if (!tr) { stats.missing.push("category:" + c.name); continue; }
    await prisma.category.update({ where: { id: c.id }, data: { nameI18n: i18n(c.name, tr) } });
    stats.categories++;
  }

  const sizes = await prisma.size.findMany({ select: { id: true, name: true } });
  for (const s of sizes) {
    const tr = T.sizes[s.name];
    if (!tr) { stats.missing.push("size:" + s.name); continue; }
    await prisma.size.update({ where: { id: s.id }, data: { nameI18n: i18n(s.name, tr) } });
    stats.sizes++;
  }

  const colors = await prisma.color.findMany({ select: { id: true, name: true } });
  for (const c of colors) {
    const tr = T.colors[c.name];
    if (!tr) { stats.missing.push("color:" + c.name); continue; }
    await prisma.color.update({ where: { id: c.id }, data: { nameI18n: i18n(c.name, tr) } });
    stats.colors++;
  }

  // Billboards: label == category name -> reuse category translations.
  const billboards = await prisma.billboard.findMany({ select: { id: true, label: true } });
  for (const b of billboards) {
    const tr = T.categories[b.label];
    if (!tr) { stats.missing.push("billboard:" + b.label); continue; }
    await prisma.billboard.update({ where: { id: b.id }, data: { labelI18n: i18n(b.label, tr) } });
    stats.billboards++;
  }

  console.log(`Translated: ${stats.products} products, ${stats.categories} categories, ${stats.sizes} sizes, ${stats.colors} colors, ${stats.billboards} billboards.`);
  if (stats.missing.length) console.log(`MISSING translations (${stats.missing.length}):`, stats.missing);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
