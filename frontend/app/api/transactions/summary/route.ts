import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFundBalances } from "@/lib/funds";

async function periodTotals(start: Date, end: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const income = Number(rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);
  return { income, expense, net: income - expense };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Current period and the equivalent period right before it (for ▲▼ comparison)
    let periodStart: Date;
    let periodEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (startDateParam && endDateParam) {
      periodStart = new Date(startDateParam);
      periodEnd = new Date(endDateParam);
      const months =
        (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 + periodEnd.getMonth() - periodStart.getMonth();
      prevStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - months, 1);
      prevEnd = periodStart;
    } else if (monthParam && yearParam) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      periodStart = new Date(y, m - 1, 1);
      periodEnd = new Date(y, m, 1);
      prevStart = new Date(y, m - 2, 1);
      prevEnd = periodStart;
    } else if (yearParam) {
      const y = parseInt(yearParam);
      periodStart = new Date(y, 0, 1);
      periodEnd = new Date(y + 1, 0, 1);
      prevStart = new Date(y - 1, 0, 1);
      prevEnd = periodStart;
    } else {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = periodStart;
    }

    const [allTime, current, previous, funds] = await Promise.all([
      prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
      periodTotals(periodStart, periodEnd),
      periodTotals(prevStart, prevEnd),
      getFundBalances(),
    ]);

    const totalIncome = Number(allTime.find((r) => r.type === "INCOME")?._sum.amount ?? 0);
    const totalExpense = Number(allTime.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);

    return NextResponse.json({
      allTime: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      currentMonth: current,
      previous,
      funds,
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
