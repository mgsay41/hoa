import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { createTransactionSchema } from "@/lib/validations/transaction";
import { checkCategoryType, parseTransactionFilters } from "@/lib/transaction-filters";
import { formatAmount } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const filters = parseTransactionFilters(new URL(request.url).searchParams);
    if (!filters) {
      return NextResponse.json({ error: "معلمات غير صالحة" }, { status: 400 });
    }
    const { where, orderBy, page, limit } = filters;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, unit: { select: { id: true, code: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const categoryError = await checkCategoryType(data.categoryId, data.type);
    if (categoryError) {
      return NextResponse.json({ error: categoryError }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        descriptionAr: data.descriptionAr,
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod,
        fund: data.fund ?? "OPERATING",
        unitId: data.unitId || null,
        periodMonth: data.unitId ? (data.periodMonth ?? null) : null,
        periodYear: data.unitId ? (data.periodYear ?? null) : null,
        attachmentUrl: data.attachmentUrl || null,
        attachmentType: data.attachmentType || null,
        notes: data.notes || null,
      },
      include: { category: true },
    });

    await logAudit({
      action: "CREATE",
      entity: "TRANSACTION",
      entityId: transaction.id,
      summary: `إضافة ${transaction.type === "INCOME" ? "إيراد" : "مصروف"}: ${transaction.descriptionAr} (${formatAmount(transaction.amount.toString())} ج.م)`,
      actorEmail: session.user.email,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
