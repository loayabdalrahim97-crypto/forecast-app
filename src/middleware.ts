import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, resolveLocale } from "@/lib/i18n/config";

/**
 * Every real page lives under /[locale]/..., so a bare "/" (or any path
 * with no locale prefix) has nothing to render and 404s. This middleware
 * catches that: it resolves a locale (§3 order — browser language for
 * now; explicit selection and account preference plug in here once
 * cookies/auth are wired up) and redirects to the prefixed path.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale) {
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get("accept-language")?.split(",")[0] ?? null;
  const locale = resolveLocale({ acceptLanguage });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals, and anything that looks like a
  // static file (has a dot in the last path segment).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
