import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getDuesLedger } from "@/lib/dues";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "") || new Date().getFullYear();
    const isAdmin = !!(await getAdminSession(request.headers));

    const ledger = await getDuesLedger(year);
    return NextResponse.json({
      ...ledger,
      units: ledger.units.map((u) => ({
        ...u,
        ownerName: isAdmin ? u.ownerName : null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
