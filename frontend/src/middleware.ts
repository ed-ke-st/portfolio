import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || "folio.skin";

// In-memory cache for domain → username resolution
const domainCache = new Map<string, { username: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function resolveUsername(domain: string): Promise<string | null> {
  const cached = domainCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.username;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/resolve-domain?domain=${encodeURIComponent(domain)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    domainCache.set(domain, {
      username: data.username,
      expiresAt: Date.now() + CACHE_TTL,
    });
    return data.username;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".") // static files like favicon.ico, robots.txt
  ) {
    return NextResponse.next();
  }

  const hostname = request.headers.get("host")?.split(":")[0] || "";

  // Platform domain (folio.skin) or localhost: pass through
  // Next.js handles (platform) vs [username] routing naturally
  if (
    hostname === PLATFORM_DOMAIN ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  ) {
    return NextResponse.next();
  }

  // Custom domain: rewrite to /{username}/{path}
  const username = await resolveUsername(hostname);
  if (username) {
    const url = request.nextUrl.clone();
    // Rewrite / → /username, /designs → /username/designs, etc.
    url.pathname = `/${username}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Unknown domain: pass through (will 404 naturally)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
