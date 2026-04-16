import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const allTimeIncome = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME" },
    });

    const allTimeExpense = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE" },
    });

    const totalIncome = allTimeIncome._sum.amount
      ? Number(allTimeIncome._sum.amount)
      : 0;
    const totalExpense = allTimeExpense._sum.amount
      ? Number(allTimeExpense._sum.amount)
      : 0;

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let monthIncome = 0;
    let monthExpense = 0;

    let periodStart: Date;
    let periodEnd: Date;

    if (startDateParam && endDateParam) {
      periodStart = new Date(startDateParam);
      periodEnd = new Date(endDateParam);
    } else if (monthParam && yearParam) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      periodStart = new Date(y, m - 1, 1);
      periodEnd = new Date(y, m, 1);
    } else if (yearParam) {
      const y = parseInt(yearParam);
      periodStart = new Date(y, 0, 1);
      periodEnd = new Date(y + 1, 0, 1);
    } else {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    {
      const [incResult, expResult] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "INCOME", date: { gte: periodStart, lt: periodEnd } },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "EXPENSE", date: { gte: periodStart, lt: periodEnd } },
        }),
      ]);

      monthIncome = incResult._sum.amount ? Number(incResult._sum.amount) : 0;
      monthExpense = expResult._sum.amount ? Number(expResult._sum.amount) : 0;
    }

    return NextResponse.json({
      allTime: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      currentMonth: {
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
