import { S3Client } from "@aws-sdk/client-s3";

// Fail fast: image upload requires S3/MinIO. If a required var is missing we
// throw at module load rather than silently constructing a client with empty
// credentials (which only fails later with opaque "SignatureDoesNotMatch" /
// "AccessDenied" errors). Local dev sets all of these in .env, so this never
// trips there.
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `[s3] Missing required environment variable ${name}. ` +
                `Set S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY.`
        );
    }
    return value;
}

const S3_REGION = requireEnv("S3_REGION");
const S3_ENDPOINT = requireEnv("S3_ENDPOINT");
const S3_ACCESS_KEY = requireEnv("S3_ACCESS_KEY");
const S3_SECRET_KEY = requireEnv("S3_SECRET_KEY");

// S3-compatible client. Points at MinIO in dev (S3_ENDPOINT, e.g.
// http://localhost:9000) and is portable to AWS S3 / Cloudflare R2 later.
export const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true, // required for MinIO
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
});

export const S3_BUCKET = requireEnv("S3_BUCKET");

// Public base URL used to build the stored object URL (served by MinIO's
// public-read bucket, or a CDN in front of it).
export const S3_PUBLIC_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/$/, "");
