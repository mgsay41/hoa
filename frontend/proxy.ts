import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Every write to the API — including the login endpoint — is rate limited per IP
  const isAdminApi =
    pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD";

  if (isAdminApi) {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "طلبات كثيرة جداً — يرجى الانتظار قليلاً" },
        { status: 429 }
      );
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // Proxy runs on the Node.js runtime, so the signed session can be fully verified here
    if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const response = NextResponse.next();

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
