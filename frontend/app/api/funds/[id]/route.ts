import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { formatAmount } from "@/lib/utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.fundTransfer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "التحويل غير موجود" }, { status: 404 });
    }

    await prisma.fundTransfer.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "FUND_TRANSFER",
      entityId: id,
      summary: `حذف تحويل صندوق (${formatAmount(existing.amount.toString())} ج.م)`,
      changes: { before: existing },
      actorEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
