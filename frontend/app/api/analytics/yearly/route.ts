import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: { date: "asc" },
    });

    const yearMap = new Map<
      number,
      { income: number; expense: number }
    >();

    for (const tx of transactions) {
      const year = new Date(tx.date).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, { income: 0, expense: 0 });
      }
      const data = yearMap.get(year)!;
      if (tx.type === "INCOME") {
        data.income += Number(tx.amount);
      } else {
        data.expense += Number(tx.amount);
      }
    }

    const yearly = Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, data]) => ({
        year,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }));

    return NextResponse.json({ yearly });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
