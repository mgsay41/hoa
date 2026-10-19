import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkCredentials,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

const loginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !checkCredentials(parsed.data.username.trim(), parsed.data.password)) {
      // Slow down guessing (the proxy also rate-limits this route per IP)
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, createSessionToken(), { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE });
    return response;
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
