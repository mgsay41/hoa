import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Returns the session only when it belongs to the configured admin.
 * Every mutating API route must go through this — a valid session alone is not enough.
 */
export async function getAdminSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail && session.user.email.toLowerCase() !== adminEmail) return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}
