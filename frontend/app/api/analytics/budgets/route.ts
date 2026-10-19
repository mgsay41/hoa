import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Budget vs actual for every expense category that has a monthly budget.
 * For a year the budget is monthly × 12 (or × months elapsed for the current year).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") ?? "") || now.getFullYear();
    const monthParam = searchParams.get("month");
    const month = monthParam ? parseInt(monthParam) : null;

    const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
    const months = month
      ? 1
      : year === now.getFullYear()
        ? now.getMonth() + 1
        : year < now.getFullYear()
          ? 12
          : 0;

    const [categories, spent] = await Promise.all([
      prisma.category.findMany({
        where: { type: "EXPENSE", monthlyBudget: { not: null } },
        orderBy: { nameAr: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { type: "EXPENSE", date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
    ]);

    const budgets = categories
      .map((c) => {
        const budget = Number(c.monthlyBudget) * months;
        const actual = Number(spent.find((s) => s.categoryId === c.id)?._sum.amount ?? 0);
        return {
          categoryId: c.id,
          nameAr: c.nameAr,
          icon: c.icon,
          color: c.color,
          budget,
          actual,
          pct: budget > 0 ? (actual / budget) * 100 : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);

    return NextResponse.json({
      budgets,
      totalBudget: budgets.reduce((s, b) => s + b.budget, 0),
      totalActual: budgets.reduce((s, b) => s + b.actual, 0),
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
