import { NextRequest, NextResponse } from "next/server";

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

  const isAdminApi =
    (pathname.startsWith("/api/transactions") && (request.method === "POST" || request.method === "PUT" || request.method === "DELETE")) ||
    (pathname.startsWith("/api/recurring") && (request.method === "POST" || request.method === "PATCH")) ||
    (pathname.startsWith("/api/categories") && (request.method === "POST" || request.method === "PUT" || request.method === "DELETE")) ||
    pathname.startsWith("/api/upload");

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
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token");
    if (!sessionCookie) {
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
