import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { diff, logAudit } from "@/lib/audit";
import { updateTransactionSchema } from "@/lib/validations/transaction";
import { checkCategoryType } from "@/lib/transaction-filters";
import { formatAmount } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true, unit: { select: { id: true, code: true } } },
    });
    if (!transaction) {
      return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json(transaction);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const input = parsed.data;

    if (input.type !== undefined || input.categoryId !== undefined) {
      const categoryError = await checkCategoryType(
        input.categoryId ?? existing.categoryId,
        input.type ?? existing.type
      );
      if (categoryError) {
        return NextResponse.json({ error: categoryError }, { status: 400 });
      }
    }

    const data: Prisma.TransactionUncheckedUpdateInput = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.date !== undefined) data.date = new Date(input.date);
    if (input.descriptionAr !== undefined) data.descriptionAr = input.descriptionAr;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
    if (input.fund !== undefined) data.fund = input.fund;
    if (input.notes !== undefined) data.notes = input.notes || null;

    if (input.unitId !== undefined) data.unitId = input.unitId || null;
    const hasUnit = input.unitId !== undefined ? !!input.unitId : !!existing.unitId;
    if (!hasUnit) {
      data.periodMonth = null;
      data.periodYear = null;
    } else {
      if (input.periodMonth !== undefined) data.periodMonth = input.periodMonth;
      if (input.periodYear !== undefined) data.periodYear = input.periodYear;
    }

    if (input.attachmentUrl !== undefined) {
      data.attachmentUrl = input.attachmentUrl || null;
      data.attachmentType = input.attachmentUrl ? (input.attachmentType ?? existing.attachmentType) : null;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
    });

    const changes = diff(existing, updated);
    // Show readable names in the public log instead of ids
    if (changes.categoryId) {
      const cats = await prisma.category.findMany({
        where: { id: { in: [existing.categoryId, updated.categoryId] } },
        select: { id: true, nameAr: true },
      });
      const name = (id: unknown) => cats.find((c) => c.id === id)?.nameAr ?? id;
      changes.categoryId = { from: name(changes.categoryId.from), to: name(changes.categoryId.to) };
    }
    if (changes.unitId) {
      const ids = [existing.unitId, updated.unitId].filter((v): v is string => !!v);
      const units = await prisma.unit.findMany({ where: { id: { in: ids } }, select: { id: true, code: true } });
      const code = (id: unknown) => units.find((u) => u.id === id)?.code ?? id;
      changes.unitId = { from: code(changes.unitId.from), to: code(changes.unitId.to) };
    }
    if (Object.keys(changes).length > 0) {
      await logAudit({
        action: "UPDATE",
        entity: "TRANSACTION",
        entityId: id,
        summary: `تعديل معاملة: ${updated.descriptionAr}`,
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
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "TRANSACTION",
      entityId: id,
      summary: `حذف ${existing.type === "INCOME" ? "إيراد" : "مصروف"}: ${existing.descriptionAr} (${formatAmount(existing.amount.toString())} ج.م)`,
      changes: { before: existing },
      actorEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
