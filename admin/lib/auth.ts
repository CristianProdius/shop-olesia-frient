import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prismadb from "@/lib/prismadb";

// Better Auth server instance for the admin/staff account pool.
// Email + password only. Uses the shared Prisma client (admin schema).
export const auth = betterAuth({
    database: prismaAdapter(prismadb, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    advanced: {
        // Distinct cookie name from the store app: both run on localhost and
        // cookies are not isolated by port.
        cookiePrefix: "admin",
    },
    plugins: [nextCookies()],
});
