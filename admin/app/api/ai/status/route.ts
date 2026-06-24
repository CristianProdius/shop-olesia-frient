import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";

// Lightweight probe so the admin UI can show the AI Copy Studio as
// enabled/disabled without ever attempting a generation. Admin-authed only —
// it reveals whether ANTHROPIC_API_KEY is set, never the key itself.
export async function GET() {
    const userId = await getUserId();
    if (!userId) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY });
}
