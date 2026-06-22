import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prismadb from "@/lib/prismadb";

// Better Auth server instance for the STORE customer account pool.
// Maps the default Better Auth models onto the prefixed Customer* tables so
// customers stay a separate pool from admin staff in the shared database.
//
// cookiePrefix keeps the store's session cookie distinct from the admin's:
// both apps run on localhost and cookies are not isolated by port.
export const auth = betterAuth({
    database: prismaAdapter(prismadb, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: { modelName: "customer" },
    session: { modelName: "customerSession" },
    account: { modelName: "customerAccount" },
    verification: { modelName: "customerVerification" },
    advanced: {
        cookiePrefix: "store",
    },
    plugins: [nextCookies()],
});
