import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Returns the authenticated customer's session (user + session), or null.
export async function getCustomerSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

// Returns the authenticated customer's id, or null if not signed in.
export async function getCustomerId(): Promise<string | null> {
    const session = await getCustomerSession();
    return session?.user?.id ?? null;
}
