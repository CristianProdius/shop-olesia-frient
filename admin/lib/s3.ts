import { S3Client } from "@aws-sdk/client-s3";

// S3-compatible client. Points at MinIO in dev (S3_ENDPOINT, e.g.
// http://localhost:9000) and is portable to AWS S3 / Cloudflare R2 later.
export const s3 = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true, // required for MinIO
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
});

export const S3_BUCKET = process.env.S3_BUCKET || "shop-images";

// Public base URL used to build the stored object URL (served by MinIO's
// public-read bucket, or a CDN in front of it).
export const S3_PUBLIC_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/$/, "");
