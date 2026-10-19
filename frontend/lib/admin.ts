import { NextResponse } from "next/server";
import { SESSION_COOKIE, readCookie, verifySessionToken } from "@/lib/session";

/**
 * Returns the admin session when the request carries a valid admin cookie, otherwise null.
 * Every mutating API route must go through this.
 */
export async function getAdminSession(headers: Headers) {
  const username = verifySessionToken(readCookie(headers, SESSION_COOKIE));
  // `email` is what the audit log stores as the actor; it holds the admin username
  return username ? { user: { email: username } } : null;
}

export function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}
