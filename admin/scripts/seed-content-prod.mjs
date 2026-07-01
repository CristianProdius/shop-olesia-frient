// Additive ("non-destructive") production content seeder.
//
// Adds stats, FAQ, editorial content blocks, journal/blog posts and reviews to
// an EXISTING production store WITHOUT deleting any existing rows. Safe to run
// repeatedly — every table is upserted or skipped by a stable natural key, so
// re-running never duplicates and never removes. In particular the 8 real blog
// posts already in production are protected (blog posts are matched by
// {storeId, slug} and only missing slugs are created).
//
// Run (from the admin/ dir):
//   STORE_ID=31175da3-44e0-4c3c-977d-79f757e5983e node --env-file=.env scripts/seed-content-prod.mjs
//
// Store resolution order:
//   1. process.env.STORE_ID (preferred in production)
//   2. fall back to the first store owned by OWNER_EMAIL (same as seed-catalog.mjs)
//
// Natural keys used for idempotency (no destructive deletes anywhere):
//   Stat         -> (storeId, key)                findFirst, create if absent
//   Faq          -> (storeId, question)           findFirst, create if absent
//   ContentBlock -> (storeId, type, order)        findFirst, create if absent
//   BlogPost     -> (storeId, slug)               findFirst, create if absent (protects existing posts)
//   Review       -> add seed reviews ONLY if the store has zero reviews
//
// Media (blog coverImage / content-block mediaUrl) reuses an existing product
// image URL fetched from the DB — no MinIO upload (prod images already exist).
import { PrismaClient } from "@prisma/client";
import {
  STATS,
  FAQS,
  BLOG_POSTS,
  CONTENT_BLOCKS,
  REVIEW_TEMPLATES,
} from "./seed-content-data.mjs";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "admin@demo.local";

const prisma = new PrismaClient();

async function resolveStore() {
  const storeId = process.env.STORE_ID;
  if (storeId) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new Error(`No store found for STORE_ID='${storeId}'.`);
    }
    return store;
  }
  const user = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) {
    throw new Error(
      `No STORE_ID set and no user '${OWNER_EMAIL}'. Set STORE_ID or OWNER_EMAIL.`
    );
  }
  const store = await prisma.store.findFirst({ where: { userId: user.id } });
  if (!store) {
    throw new Error(`No store found for owner '${OWNER_EMAIL}'.`);
  }
  return store;
}

async function main() {
  const store = await resolveStore();
  console.log(`Store: ${store.id} (${store.name})`);

  // Gather existing product images once so blog/content media can reuse a real
  // production image URL without touching MinIO.
  const products = await prisma.product.findMany({
    where: { storeId: store.id, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, images: { select: { url: true }, take: 1 } },
  });
  const productImageUrls = products
    .map((p) => p.images[0]?.url)
    .filter(Boolean);
  // Cover for blog post / content block index `i`, cycling through real images.
  const mediaFor = (i) =>
    productImageUrls.length ? productImageUrls[i % productImageUrls.length] : null;

  const summary = {};

  // 1) Stats — natural key (storeId, key).
  let statAdded = 0, statSkipped = 0;
  for (let i = 0; i < STATS.length; i++) {
    const s = STATS[i];
    const existing = await prisma.stat.findFirst({
      where: { storeId: store.id, key: s.key },
      select: { id: true },
    });
    if (existing) { statSkipped++; continue; }
    await prisma.stat.create({
      data: { storeId: store.id, order: i, isPublished: true, ...s },
    });
    statAdded++;
  }
  summary.stats = { added: statAdded, skipped: statSkipped };

  // 2) FAQ — natural key (storeId, question).
  let faqAdded = 0, faqSkipped = 0;
  for (let i = 0; i < FAQS.length; i++) {
    const f = FAQS[i];
    const existing = await prisma.faq.findFirst({
      where: { storeId: store.id, question: f.question },
      select: { id: true },
    });
    if (existing) { faqSkipped++; continue; }
    await prisma.faq.create({
      data: { storeId: store.id, order: i, isPublished: true, ...f },
    });
    faqAdded++;
  }
  summary.faqs = { added: faqAdded, skipped: faqSkipped };

  // 3) Content blocks — natural key (storeId, type, order). mediaUrl reuses a
  //    real product image (by index, matching the local seed's behaviour).
  let blockAdded = 0, blockSkipped = 0;
  for (let i = 0; i < CONTENT_BLOCKS.length; i++) {
    const b = CONTENT_BLOCKS[i];
    const existing = await prisma.contentBlock.findFirst({
      where: { storeId: store.id, type: b.type, order: b.order },
      select: { id: true },
    });
    if (existing) { blockSkipped++; continue; }
    await prisma.contentBlock.create({
      data: {
        storeId: store.id,
        isPublished: true,
        mediaUrl: mediaFor(i),
        ...b,
      },
    });
    blockAdded++;
  }
  summary.contentBlocks = { added: blockAdded, skipped: blockSkipped };

  // 4) Blog posts — natural key (storeId, slug). SKIP any slug that already
  //    exists so the 8 real production posts are never touched or duplicated.
  //    Set SEED_SKIP_BLOG=1 to skip blog seeding entirely (e.g. on a store that
  //    already has real editorial content and shouldn't get seed filler posts).
  let blogAdded = 0, blogSkipped = 0;
  if (process.env.SEED_SKIP_BLOG) {
    blogSkipped = BLOG_POSTS.length;
    console.log("Blog: SEED_SKIP_BLOG set — skipping blog seeding (existing posts untouched).");
  } else {
    for (let i = 0; i < BLOG_POSTS.length; i++) {
      const post = BLOG_POSTS[i];
      const existing = await prisma.blogPost.findFirst({
        where: { storeId: store.id, slug: post.slug },
        select: { id: true },
      });
      if (existing) { blogSkipped++; continue; }
      await prisma.blogPost.create({
        data: {
          storeId: store.id,
          isPublished: true,
          coverImage: mediaFor(i),
          ...post,
        },
      });
      blogAdded++;
    }
  }
  summary.blogPosts = { added: blogAdded, skipped: blogSkipped };

  // 5) Reviews — only seed if the store currently has ZERO reviews. Otherwise
  //    skip entirely to avoid duplicating real/moderated reviews.
  let reviewAdded = 0, reviewSkipped = 0;
  const existingReviewCount = await prisma.review.count({
    where: { storeId: store.id },
  });
  if (existingReviewCount > 0) {
    reviewSkipped = REVIEW_TEMPLATES.length; // signal: skipped seeding
    console.log(
      `Reviews: store already has ${existingReviewCount} review(s) — skipping seed reviews.`
    );
  } else {
    const reviewProductCount = Math.min(6, products.length);
    let dayOffset = 0;
    for (let pi = 0; pi < reviewProductCount; pi++) {
      const product = products[pi];
      const howMany = 2 + (pi % 2); // 2 or 3 reviews per product
      for (let r = 0; r < howMany; r++) {
        const tpl = REVIEW_TEMPLATES[(pi + r) % REVIEW_TEMPLATES.length];
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
        reviewAdded++;
      }
    }
  }
  summary.reviews = { added: reviewAdded, skipped: reviewSkipped };

  console.log("\nAdditive content seed complete (no rows deleted):");
  console.log(`  Stats:          +${summary.stats.added} added, ${summary.stats.skipped} skipped`);
  console.log(`  FAQs:           +${summary.faqs.added} added, ${summary.faqs.skipped} skipped`);
  console.log(`  Content blocks: +${summary.contentBlocks.added} added, ${summary.contentBlocks.skipped} skipped`);
  console.log(`  Blog posts:     +${summary.blogPosts.added} added, ${summary.blogPosts.skipped} skipped (existing posts preserved)`);
  if (existingReviewCount > 0) {
    console.log(`  Reviews:        0 added (store already had ${existingReviewCount}; left untouched)`);
  } else {
    console.log(`  Reviews:        +${summary.reviews.added} added, 0 skipped`);
  }
  console.log(`STORE_ID=${store.id}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
