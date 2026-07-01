// Seeds the shop from tiktok-products/catalog.json:
// uploads the 3 images/product to MinIO and creates store, billboards,
// categories, sizes (from dress_length), colors, and products.
//
// Run from the admin/ dir AFTER the owner has signed up via Better Auth:
//   OWNER_EMAIL=admin@demo.local node --env-file=.env scripts/seed-catalog.mjs
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import {
  STATS,
  FAQS,
  BLOG_POSTS,
  CONTENT_BLOCKS,
  REVIEW_TEMPLATES,
} from "./seed-content-data.mjs";

const ROOT = path.resolve(process.cwd(), "..");
const IMG_DIR = path.join(ROOT, "tiktok-products");
const catalog = JSON.parse(readFileSync(path.join(IMG_DIR, "catalog.json"), "utf8"));

const OWNER_EMAIL = process.env.OWNER_EMAIL || "admin@demo.local";
const STORE_NAME = process.env.STORE_NAME || "Olesia Frient";

const COLOR_HEX = {
  beige: "#F5F5DC", black: "#111111", blue: "#1E40AF", brown: "#8B4513",
  cream: "#FFFDD0", green: "#15803D", ivory: "#FFFFF0", "light blue": "#ADD8E6",
  mint: "#98FF98", navy: "#1E293B", pink: "#FFC0CB", red: "#DC2626",
  white: "#FFFFFF", yellow: "#FACC15",
};
const sizeLabel = (len) => (len && len.trim() ? len.trim() : "One Size");

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
});
const BUCKET = process.env.S3_BUCKET || "shop-images";
const PUBLIC = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/$/, "");

async function uploadImage(filename, cache) {
  if (cache.has(filename)) return cache.get(filename);
  const body = readFileSync(path.join(IMG_DIR, filename));
  const key = `products/${randomUUID()}-${filename}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: "image/jpeg" }));
  const url = `${PUBLIC}/${BUCKET}/${key}`;
  cache.set(filename, url);
  return url;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) throw new Error(`No user '${OWNER_EMAIL}'. Sign up in the admin first.`);

  // Fresh start for this owner so the seed is re-runnable.
  const existing = await prisma.store.findFirst({ where: { userId: user.id } });
  if (existing) {
    console.log(`Removing existing store ${existing.id} for re-seed...`);
    await prisma.orderItem.deleteMany({ where: { order: { storeId: existing.id } } });
    await prisma.order.deleteMany({ where: { storeId: existing.id } });
    await prisma.image.deleteMany({ where: { product: { storeId: existing.id } } });
    await prisma.product.deleteMany({ where: { storeId: existing.id } });
    await prisma.category.deleteMany({ where: { storeId: existing.id } });
    await prisma.billboard.deleteMany({ where: { storeId: existing.id } });
    await prisma.size.deleteMany({ where: { storeId: existing.id } });
    await prisma.color.deleteMany({ where: { storeId: existing.id } });
    await prisma.store.delete({ where: { id: existing.id } });
  }

  const store = await prisma.store.create({ data: { name: STORE_NAME, userId: user.id } });
  console.log(`Store: ${store.id}`);

  // Upload every referenced image once.
  const cache = new Map();
  let n = 0;
  for (const p of catalog) {
    for (const f of [p.image1, p.image2, p.image3]) {
      if (f) { await uploadImage(f, cache); n++; }
    }
  }
  console.log(`Uploaded ${cache.size} images (${n} refs) to MinIO.`);

  // Colors
  const colorId = {};
  for (const name of [...new Set(catalog.map((p) => p.color).filter(Boolean))]) {
    const c = await prisma.color.create({ data: { storeId: store.id, name, value: COLOR_HEX[name] || "#888888" } });
    colorId[name] = c.id;
  }

  // Sizes (from dress_length)
  const sizeId = {};
  for (const label of [...new Set(catalog.map((p) => sizeLabel(p.dress_length)))]) {
    const s = await prisma.size.create({ data: { storeId: store.id, name: label, value: label } });
    sizeId[label] = s.id;
  }

  // Categories (+ one billboard each, using the first product image)
  const categoryId = {};
  for (const name of [...new Set(catalog.map((p) => p.category).filter(Boolean))]) {
    const first = catalog.find((p) => p.category === name);
    const bb = await prisma.billboard.create({
      data: { storeId: store.id, label: name, imageUrl: cache.get(first.image1) },
    });
    const cat = await prisma.category.create({ data: { storeId: store.id, billboardId: bb.id, name } });
    categoryId[name] = cat.id;
  }

  // Featured = top 12 by views
  const featured = new Set([...catalog].sort((a, b) => b.views - a.views).slice(0, 12).map((p) => p.product));

  let created = 0;
  const createdProducts = [];
  for (const p of catalog) {
    const price = 19.99 + (parseInt(p.product, 10) % 12) * 5;
    const images = [p.image1, p.image2, p.image3].filter(Boolean).map((f) => ({ url: cache.get(f) }));
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: categoryId[p.category],
        name: p.title,
        nameI18n: { en: p.title },
        price,
        isFeatured: featured.has(p.product),
        isArchived: false,
        sizeId: sizeId[sizeLabel(p.dress_length)],
        colorId: colorId[p.color] || Object.values(colorId)[0],
        images: { create: images },
      },
    });
    createdProducts.push({ id: product.id, coverImage: cache.get(p.image1) });
    created++;
  }

  console.log(`Created ${created} products, ${Object.keys(categoryId).length} categories, ${Object.keys(sizeId).length} sizes, ${Object.keys(colorId).length} colors.`);

  // --------------------------------------------------------------------------
  // Content-driven storefront pages (stats, FAQ, journal, editorial, reviews).
  // storeId-scoped; the store was just (re)created above, so these tables hold
  // no rows for it yet — but we deleteMany first to keep the block idempotent
  // even if a future partial re-run leaves orphans for this storeId.
  // --------------------------------------------------------------------------

  // 1) Stats (homepage / about trust strip)
  await prisma.stat.deleteMany({ where: { storeId: store.id } });
  const stats = STATS;
  let statN = 0;
  for (let i = 0; i < stats.length; i++) {
    await prisma.stat.create({
      data: { storeId: store.id, order: i, isPublished: true, ...stats[i] },
    });
    statN++;
  }

  // 2) FAQ (shipping, sizing, returns, care, orders)
  await prisma.faq.deleteMany({ where: { storeId: store.id } });
  const faqs = FAQS;
  let faqN = 0;
  for (let i = 0; i < faqs.length; i++) {
    await prisma.faq.create({
      data: { storeId: store.id, order: i, isPublished: true, ...faqs[i] },
    });
    faqN++;
  }

  // 3) Blog / Journal posts
  await prisma.blogPost.deleteMany({ where: { storeId: store.id } });
  const blogCover = (i) =>
    createdProducts[i % createdProducts.length]?.coverImage || null;
  const blogPosts = BLOG_POSTS.map((post, i) => ({ ...post, coverImage: blogCover(i) }));
  let blogN = 0;
  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: { storeId: store.id, isPublished: true, ...post },
    });
    blogN++;
  }

  // 4) Content blocks (brand story -> /about, behind-the-scenes -> /atelier)
  await prisma.contentBlock.deleteMany({ where: { storeId: store.id } });
  const contentBlocks = CONTENT_BLOCKS.map((block, i) => ({ ...block, mediaUrl: createdProducts[i]?.coverImage || null }));
  let blockN = 0;
  for (const block of contentBlocks) {
    await prisma.contentBlock.create({
      data: { storeId: store.id, isPublished: true, ...block },
    });
    blockN++;
  }

  // 5) Reviews (approved, guest) on the first handful of products
  await prisma.review.deleteMany({ where: { storeId: store.id } });
  const reviewTemplates = REVIEW_TEMPLATES;
  // ~3 reviews each across the first 6 products (or fewer if fewer products).
  const reviewProductCount = Math.min(6, createdProducts.length);
  let reviewN = 0;
  let dayOffset = 0;
  for (let pi = 0; pi < reviewProductCount; pi++) {
    const product = createdProducts[pi];
    const howMany = 2 + (pi % 2); // 2 or 3 reviews per product
    for (let r = 0; r < howMany; r++) {
      const tpl = reviewTemplates[(pi + r) % reviewTemplates.length];
      const createdAt = new Date("2026-05-01T12:00:00.000Z");
      createdAt.setDate(createdAt.getDate() + dayOffset);
      dayOffset += 3;
      await prisma.review.create({
        data: {
          storeId: store.id,
          productId: product.id,
          customerId: null,
          customerName: tpl.customerName,
          rating: tpl.rating,
          body: tpl.body,
          bodyI18n: tpl.bodyI18n,
          status: "approved",
          source: "web",
          fitVote: tpl.fitVote,
          verified: tpl.verified,
          createdAt,
        },
      });
      reviewN++;
    }
  }

  console.log(`Created ${statN} stats, ${faqN} FAQs, ${blogN} blog posts, ${blockN} content blocks, ${reviewN} reviews.`);
  console.log(`STORE_ID=${store.id}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
