import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const typeParam = searchParams.get("type") as "INCOME" | "EXPENSE" | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (monthParam && yearParam) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    } else if (yearParam) {
      const y = parseInt(yearParam);
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
    }

    if (typeParam) {
      where.type = typeParam;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        categoryId: true,
        type: true,
        category: {
          select: {
            id: true,
            nameAr: true,
            icon: true,
            color: true,
            type: true,
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        nameAr: string;
        icon: string | null;
        color: string | null;
        type: string;
        total: number;
        count: number;
      }
    >();

    for (const tx of transactions) {
      const key = tx.categoryId;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId: tx.category.id,
          nameAr: tx.category.nameAr,
          icon: tx.category.icon,
          color: tx.category.color,
          type: tx.category.type,
          total: 0,
          count: 0,
        });
      }
      const entry = categoryMap.get(key)!;
      entry.total += Number(tx.amount);
      entry.count += 1;
    }

    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total
    );

    const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);

    return NextResponse.json({ categories, grandTotal });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
