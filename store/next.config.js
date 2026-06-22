/** @type {import('next').NextConfig} */

// Allow Next/Image to load product images from the MinIO (S3-compatible) host.
const remotePatterns = [];

const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
if (publicUrl) {
    try {
        const u = new URL(publicUrl);
        remotePatterns.push({
            protocol: u.protocol.replace(":", ""),
            hostname: u.hostname,
            port: u.port || "",
            pathname: "/**",
        });
    } catch (_) {
        // ignore malformed URL; fall back to localhost pattern below
    }
}

// Default dev MinIO endpoint.
remotePatterns.push({ protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" });

const nextConfig = {
    images: {
        remotePatterns,
    },
};

const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();

module.exports = withNextIntl(nextConfig);
