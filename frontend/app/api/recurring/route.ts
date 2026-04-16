import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createRecurringSchema } from "@/lib/validations/recurring";

export async function GET() {
  try {
    const recurringItems = await prisma.recurringItem.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurringItems);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRecurringSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

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

    const now = new Date();
    const startDate = new Date(data.startDate);
    if (startDate <= now) {
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const transactionDate = new Date(
        currentYear,
        currentMonth - 1,
        data.dayOfMonth
      );

      const endDate = data.endDate ? new Date(data.endDate) : null;
      const withinEndDate = !endDate || transactionDate <= endDate;

      if (withinEndDate && transactionDate.getMonth() + 1 === currentMonth) {
        await prisma.transaction.create({
          data: {
            type: data.type,
            amount: data.amount,
            date: transactionDate,
            descriptionAr: `${data.nameAr} — ${transactionDate.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`,
            categoryId: data.categoryId,
            paymentMethod: "CASH",
            recurringItemId: recurringItem.id,
          },
        });

        await prisma.recurringItem.update({
          where: { id: recurringItem.id },
          data: {
            lastGeneratedMonth: currentMonth,
            lastGeneratedYear: currentYear,
          },
        });
      }
    }

    return NextResponse.json(recurringItem, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
