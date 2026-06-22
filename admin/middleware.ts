import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const LOCALE_PREFIX = /^\/(en|ru|ro)(?=\/|$)/;

// Composes the Better Auth gate with next-intl locale routing.
// Auth redirects (locale-aware) take precedence; otherwise next-intl handles
// locale detection / prefixing. API routes are excluded via the matcher and do
// their own auth.
export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const localeMatch = pathname.match(LOCALE_PREFIX);
    const locale = localeMatch?.[1] ?? routing.defaultLocale;
    const pathnameWithoutLocale = pathname.replace(LOCALE_PREFIX, "") || "/";

    const isAuthPage =
        pathnameWithoutLocale.startsWith("/sign-in") ||
        pathnameWithoutLocale.startsWith("/sign-up");

    const sessionCookie = getSessionCookie(request, { cookiePrefix: "admin" });

    if (!sessionCookie && !isAuthPage) {
        return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
    }

    if (sessionCookie && isAuthPage) {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
