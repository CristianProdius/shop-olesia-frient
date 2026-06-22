import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Returns the authenticated staff user's id, or null if not signed in.
// Drop-in replacement for Clerk's `const { userId } = await auth()`.
export async function getUserId(): Promise<string | null> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session?.user?.id ?? null;
}

// Returns the full session (user + session), or null.
export async function getSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}
