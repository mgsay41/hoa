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

    let monthIncome = 0;
    let monthExpense = 0;

    if (monthParam && yearParam) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);

      const [incResult, expResult] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "INCOME", date: { gte: startDate, lt: endDate } },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "EXPENSE", date: { gte: startDate, lt: endDate } },
        }),
      ]);

      monthIncome = incResult._sum.amount ? Number(incResult._sum.amount) : 0;
      monthExpense = expResult._sum.amount ? Number(expResult._sum.amount) : 0;
    } else {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [incResult, expResult] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "INCOME", date: { gte: startDate, lt: endDate } },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: "EXPENSE", date: { gte: startDate, lt: endDate } },
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
