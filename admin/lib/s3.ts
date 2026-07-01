import { S3Client } from "@aws-sdk/client-s3";

// S3/MinIO config is resolved and validated at RUNTIME, not at module load.
// `next build` imports this module while collecting page data for /api/upload
// with the S3_* vars unset; constructing an S3Client with an empty region there
// throws "Region is missing" and breaks the production build. So the client is
// created lazily on first use (getS3), guarded by a fail-fast config check.
const REQUIRED = ["S3_REGION", "S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET"] as const;

const env = (name: string): string => process.env[name] || "";

// Throws a clear error if a required S3 var is missing rather than letting the
// AWS SDK fail later with an opaque "Region is missing" / "SignatureDoesNotMatch".
// Local dev + the production container set all of these, so this never trips there.
export function assertS3Config(): void {
    for (const name of REQUIRED) {
        if (!process.env[name]) {
            throw new Error(
                `[s3] Missing required environment variable ${name}. ` +
                    `Set S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY.`
            );
        }
    }
}

let client: S3Client | null = null;

// Lazily construct the S3-compatible client (MinIO in dev via S3_ENDPOINT,
// portable to AWS S3 / Cloudflare R2 later). Validates config first.
export function getS3(): S3Client {
    assertS3Config();
    if (!client) {
        client = new S3Client({
            region: env("S3_REGION"),
            endpoint: env("S3_ENDPOINT"),
            forcePathStyle: true, // required for MinIO
            credentials: {
                accessKeyId: env("S3_ACCESS_KEY"),
                secretAccessKey: env("S3_SECRET_KEY"),
            },
        });
    }
    return client;
}

export const S3_BUCKET = (): string => env("S3_BUCKET");

// Public base URL used to build the stored object URL (served by MinIO's
// public-read bucket, or a CDN in front of it).
export const S3_PUBLIC_URL = (): string => (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/$/, "");
