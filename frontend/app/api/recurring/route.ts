import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { generateRecurring } from "@/lib/recurring";
import { checkCategoryType } from "@/lib/transaction-filters";
import { createRecurringSchema } from "@/lib/validations/recurring";
import { formatAmount } from "@/lib/utils";

export async function GET() {
  try {
    const recurringItems = await prisma.recurringItem.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurringItems);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = createRecurringSchema.safeParse(body);
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

    const recurringItem = await prisma.recurringItem.create({
      data: {
        nameAr: data.nameAr,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        dayOfMonth: data.dayOfMonth,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes || null,
      },
      include: { category: true },
    });

    await logAudit({
      action: "CREATE",
      entity: "RECURRING",
      entityId: recurringItem.id,
      summary: `إضافة بند متكرر: ${recurringItem.nameAr} (${formatAmount(recurringItem.amount.toString())} ج.م شهرياً)`,
      actorEmail: session.user.email,
    });

    // Only creates transactions whose day has already arrived — never future-dated ones
    const { generated } = await generateRecurring({ itemId: recurringItem.id });

    return NextResponse.json({ ...recurringItem, generated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "الحذف غير مسموح — يمكن تعطيل البند بدلاً من ذلك" },
    { status: 405 }
  );
}
