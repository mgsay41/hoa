import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { generateRecurring, previousMonthOf } from "@/lib/recurring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;

    const existing = await prisma.recurringItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "البند المتكرر غير موجود" }, { status: 404 });
    }

    const activating = !existing.isActive;

    // When resuming, skip the paused months instead of back-filling them
    const resumeMarker = activating ? previousMonthOf(new Date()) : null;
    const isAhead =
      resumeMarker &&
      existing.lastGeneratedYear &&
      existing.lastGeneratedMonth &&
      existing.lastGeneratedYear * 12 + existing.lastGeneratedMonth >= resumeMarker.year * 12 + resumeMarker.month;

    await prisma.recurringItem.update({
      where: { id },
      data: {
        isActive: activating,
        ...(resumeMarker && !isAhead
          ? { lastGeneratedMonth: resumeMarker.month, lastGeneratedYear: resumeMarker.year }
          : {}),
      },
    });

    if (activating) await generateRecurring({ itemId: id });

    const updated = await prisma.recurringItem.findUnique({ where: { id }, include: { category: true } });

    await logAudit({
      action: "UPDATE",
      entity: "RECURRING",
      entityId: id,
      summary: `${activating ? "تفعيل" : "تعطيل"} بند متكرر: ${existing.nameAr}`,
      changes: { isActive: { from: existing.isActive, to: activating } },
      actorEmail: session.user.email,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
