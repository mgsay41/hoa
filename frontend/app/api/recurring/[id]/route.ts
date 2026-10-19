import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { diff, logAudit } from "@/lib/audit";
import { checkCategoryType } from "@/lib/transaction-filters";
import { updateRecurringSchema } from "@/lib/validations/recurring";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.recurringItem.findUnique({ where: { id }, include: { category: true } });
    if (!item) {
      return NextResponse.json({ error: "البند المتكرر غير موجود" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

/** Edits apply to months generated from now on; already-created transactions are untouched. */
export async function PUT(
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

    const body = await request.json();
    const parsed = updateRecurringSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const input = parsed.data;

    if (input.categoryId !== undefined) {
      const categoryError = await checkCategoryType(input.categoryId, existing.type);
      if (categoryError) {
        return NextResponse.json({ error: categoryError }, { status: 400 });
      }
    }

    const data: Prisma.RecurringItemUncheckedUpdateInput = {};
    if (input.nameAr !== undefined) data.nameAr = input.nameAr;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.dayOfMonth !== undefined) data.dayOfMonth = input.dayOfMonth;
    if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.notes !== undefined) data.notes = input.notes || null;

    const updated = await prisma.recurringItem.update({
      where: { id },
      data,
      include: { category: true },
    });

    const changes = diff(existing, updated);
    if (Object.keys(changes).length > 0) {
      await logAudit({
        action: "UPDATE",
        entity: "RECURRING",
        entityId: id,
        summary: `تعديل بند متكرر: ${updated.nameAr}`,
        changes,
        actorEmail: session.user.email,
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
