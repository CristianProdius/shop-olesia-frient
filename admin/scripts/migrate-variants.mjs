// Idempotent migration: ensure every Product has at least one ProductVariant.
// Existing products carry a scalar sizeId/colorId pair; we create one variant
// mirroring that pair. Re-running skips products that already have variants.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sizeId: true, colorId: true, sku: true },
  });

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await prisma.productVariant.count({
      where: { productId: product.id },
    });

    if (existing > 0) {
      skipped += 1;
      continue;
    }

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sizeId: product.sizeId,
        colorId: product.colorId,
        sku: product.sku ?? `${product.id.slice(0, 8)}`,
        stockQty: 10,
      },
    });
    created += 1;
  }

  const total = await prisma.productVariant.count();

  console.log(`Products processed: ${products.length}`);
  console.log(`Variants created:   ${created}`);
  console.log(`Products skipped:   ${skipped}`);
  console.log(`Total ProductVariant rows: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
