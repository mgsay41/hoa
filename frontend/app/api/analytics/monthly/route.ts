import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: { date: "asc" },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    for (const tx of transactions) {
      const monthIndex = new Date(tx.date).getMonth();
      if (tx.type === "INCOME") {
        monthlyData[monthIndex].income += Number(tx.amount);
      } else {
        monthlyData[monthIndex].expense += Number(tx.amount);
      }
    }

    return NextResponse.json({ year, monthly: monthlyData });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
