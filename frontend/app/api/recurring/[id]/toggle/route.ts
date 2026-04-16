import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.recurringItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "البند المتكرر غير موجود" },
        { status: 404 }
      );
    }

    const updated = await prisma.recurringItem.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
