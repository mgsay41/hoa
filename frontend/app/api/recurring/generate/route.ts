import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { generateRecurring } from "@/lib/recurring";

async function handle(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isAdmin = !isCron && !!(await getAdminSession(request.headers));

    if (!isAdmin && !isCron) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const result = await generateRecurring();
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

// Vercel Cron calls with GET (and the CRON_SECRET bearer); the admin "generate now" button uses POST
export const GET = handle;
export const POST = handle;
