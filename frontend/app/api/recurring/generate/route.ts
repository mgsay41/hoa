import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAdmin = !!session;
    const isCron =
      cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isAdmin && !isCron) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const activeItems = await prisma.recurringItem.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(currentYear, currentMonth - 1, 1) } },
        ],
      },
      include: { category: true },
    });

    let generated = 0;

    for (const item of activeItems) {
      if (
        item.lastGeneratedMonth === currentMonth &&
        item.lastGeneratedYear === currentYear
      ) {
        continue;
      }

      const endDate = item.endDate ? new Date(item.endDate) : null;
      const transactionDate = new Date(
        currentYear,
        currentMonth - 1,
        item.dayOfMonth
      );

      if (endDate && transactionDate > endDate) {
        continue;
      }

      if (transactionDate > now) {
        continue;
      }

      const monthName = transactionDate.toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric",
      });

      await prisma.transaction.create({
        data: {
          type: item.type,
          amount: item.amount,
          date: transactionDate,
          descriptionAr: `${item.nameAr} — ${monthName}`,
          categoryId: item.categoryId,
          paymentMethod: "CASH",
          recurringItemId: item.id,
        },
      });

      await prisma.recurringItem.update({
        where: { id: item.id },
        data: {
          lastGeneratedMonth: currentMonth,
          lastGeneratedYear: currentYear,
        },
      });

      generated++;
    }

    return NextResponse.json({
      success: true,
      generated,
      month: currentMonth,
      year: currentYear,
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
