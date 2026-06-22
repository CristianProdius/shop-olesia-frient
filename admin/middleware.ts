import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Lightweight edge check: presence of a Better Auth session cookie.
// Full session validation still happens in server components / route handlers.
export function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request, { cookiePrefix: "admin" });
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    // Not signed in and not on an auth page -> go sign in.
    if (!sessionCookie && !isAuthPage) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Already signed in but visiting an auth page -> go home.
    if (sessionCookie && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Guard PAGES only. Exclude all API routes (they do their own auth and
        // must not be redirected — e.g. the public cross-origin checkout endpoint),
        // Next internals, and static assets.
        "/((?!api|_next/static|_next/image|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
