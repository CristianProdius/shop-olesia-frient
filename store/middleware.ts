import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Detects the locale and rewrites/redirects to a locale-prefixed path
// (/en, /ru, /ro). Auth on the store is enforced per-page (checkout), not here.
export default createMiddleware(routing);

export const config = {
    // Match all pathnames except API routes, Next internals, and files with an
    // extension (static assets).
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
