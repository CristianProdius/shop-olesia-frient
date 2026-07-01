import { S3Client } from "@aws-sdk/client-s3";

// S3/MinIO config is validated at RUNTIME, not at module load. `next build`
// imports this module while collecting page data for /api/upload with the S3_*
// vars unset, so throwing at import (as an eager check would) breaks the
// production build. Instead we construct the client from whatever is present and
// fail fast the first time an upload is actually attempted (assertS3Config).
const REQUIRED = ["S3_REGION", "S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET"] as const;

const env = (name: string): string => process.env[name] || "";

let validated = false;

// Call at the start of any request that uses S3. Throws a clear error if a
// required var is missing rather than letting the AWS SDK fail later with an
// opaque "SignatureDoesNotMatch" / "AccessDenied". Local dev + the production
// container set all of these, so this never trips there.
export function assertS3Config(): void {
    if (validated) return;
    for (const name of REQUIRED) {
        if (!process.env[name]) {
            throw new Error(
                `[s3] Missing required environment variable ${name}. ` +
                    `Set S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY.`
            );
        }
    }
    validated = true;
}

// S3-compatible client. Points at MinIO in dev (S3_ENDPOINT, e.g.
// http://localhost:9000) and is portable to AWS S3 / Cloudflare R2 later.
export const s3 = new S3Client({
    region: env("S3_REGION"),
    endpoint: env("S3_ENDPOINT") || undefined,
    forcePathStyle: true, // required for MinIO
    credentials: {
        accessKeyId: env("S3_ACCESS_KEY"),
        secretAccessKey: env("S3_SECRET_KEY"),
    },
});

export const S3_BUCKET = env("S3_BUCKET");

// Public base URL used to build the stored object URL (served by MinIO's
// public-read bucket, or a CDN in front of it).
export const S3_PUBLIC_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/$/, "");
