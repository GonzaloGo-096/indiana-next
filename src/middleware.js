import { NextResponse } from "next/server";
import {
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_PAGE_PATH,
  getRetryAfterSeconds,
  isMaintenanceEnabled,
  isValidBypassToken,
} from "./lib/maintenance";

const ALLOWED_API_EXACT = new Set(["/api/revalidate", "/api/photos/create"]);
const BLOCKED_API_EXACT = new Set(["/api/careers"]);

function maintenanceHeaders() {
  return {
    "Retry-After": getRetryAfterSeconds(),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow",
  };
}

function isStaticLikePath(pathname) {
  if (pathname === "/_next") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/assets") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname.startsWith("/manifest")) return true;
  if (pathname.startsWith("/assets/")) return true;
  // Any public file (e.g. /file.svg, /fonts/x.woff2, /logo.webp).
  return /\.[^/]+$/.test(pathname);
}

function isAllowedApiPath(pathname) {
  if (ALLOWED_API_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/api/photos/update/")) return true;
  return false;
}

function withHeaders(response, headersObj) {
  for (const [key, value] of Object.entries(headersObj)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // 1) Explicit OFF first: remove bypass cookie.
  const bypassParam = searchParams.get("maintenance_bypass");
  if (bypassParam === "off") {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("maintenance_bypass");

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.delete(MAINTENANCE_BYPASS_COOKIE);
    return response;
  }

  // 2) Valid bypass token: set cookie and redirect to clean URL.
  if (bypassParam && isValidBypassToken(bypassParam)) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("maintenance_bypass");

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(MAINTENANCE_BYPASS_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  if (!isMaintenanceEnabled()) {
    return NextResponse.next();
  }

  const hasBypass = request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === "1";
  if (hasBypass) {
    return NextResponse.next();
  }

  if (isStaticLikePath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === MAINTENANCE_PAGE_PATH) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (isAllowedApiPath(pathname)) {
      return NextResponse.next();
    }

    // Explicitly blocked or non-allowlisted APIs receive maintenance response.
    if (BLOCKED_API_EXACT.has(pathname) || !isAllowedApiPath(pathname)) {
      return NextResponse.json(
        {
          ok: false,
          code: "MAINTENANCE_MODE",
          message: "Servicio temporalmente en mantenimiento",
        },
        {
          status: 503,
          headers: maintenanceHeaders(),
        }
      );
    }
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = MAINTENANCE_PAGE_PATH;
  rewriteUrl.search = "";
  const response = NextResponse.rewrite(rewriteUrl);

  return withHeaders(response, maintenanceHeaders());
}

// Incluir "/" explícito: `/:path*` no aplica al home en Next, y el home quedaba
// fuera del middleware (home “normal” y /planes en mantenimiento si MODE=true).
export const config = {
  matcher: ["/", "/:path*"],
};
