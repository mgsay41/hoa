import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { diff, logAudit } from "@/lib/audit";
import { categorySchema } from "@/lib/validations/category";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, recurring: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "الفئة غير موجودة" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const inUse = existing._count.transactions + existing._count.recurring > 0;
    if (parsed.data.type !== undefined && parsed.data.type !== existing.type && inUse) {
      return NextResponse.json(
        { error: "لا يمكن تغيير نوع فئة مستخدمة في معاملات أو بنود متكررة" },
        { status: 409 }
      );
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (parsed.data.nameAr !== undefined) data.nameAr = parsed.data.nameAr;
    if (parsed.data.type !== undefined) data.type = parsed.data.type;
    if (parsed.data.icon !== undefined) data.icon = parsed.data.icon || null;
    if (parsed.data.color !== undefined) data.color = parsed.data.color || null;
    if (parsed.data.monthlyBudget !== undefined) data.monthlyBudget = parsed.data.monthlyBudget || null;
    if ((parsed.data.type ?? existing.type) === "INCOME") data.monthlyBudget = null;

    const updated = await prisma.category.update({ where: { id }, data });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _count, ...before } = existing;
    const changes = diff(before, updated);
    if (Object.keys(changes).length > 0) {
      await logAudit({
        action: "UPDATE",
        entity: "CATEGORY",
        entityId: id,
        summary: `تعديل فئة: ${updated.nameAr}`,
        changes,
        actorEmail: session.user.email,
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, recurring: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "الفئة غير موجودة" }, { status: 404 });
    }

    if (existing._count.transactions + existing._count.recurring > 0) {
      return NextResponse.json({ error: "الفئة مستخدمة في معاملات موجودة" }, { status: 409 });
    }

    await prisma.category.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "CATEGORY",
      entityId: id,
      summary: `حذف فئة: ${existing.nameAr}`,
      actorEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
