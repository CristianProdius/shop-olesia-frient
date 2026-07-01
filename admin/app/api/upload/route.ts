import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3, S3_BUCKET, S3_PUBLIC_URL, assertS3Config } from "@/lib/s3";
import { getUserId } from "@/lib/server-auth";

// Returns a short-lived presigned PUT URL the browser uses to upload a file
// directly to MinIO, plus the public URL the file will be reachable at.
export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fail fast with a clear error if S3/MinIO env vars are missing.
    assertS3Config();

    const { fileName, contentType } = await req.json();
    if (!fileName || !contentType) {
        return new NextResponse("fileName and contentType are required", { status: 400 });
    }

    const safeName = String(fileName).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `products/${randomUUID()}-${safeName}`;

    const bucket = S3_BUCKET();
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(getS3(), command, { expiresIn: 60 });
    const publicUrl = `${S3_PUBLIC_URL()}/${bucket}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl });
}
