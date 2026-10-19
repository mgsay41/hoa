import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Month-by-month running balance from the first transaction until the current month. */
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: { type: true, amount: true, date: true },
      orderBy: { date: "asc" },
    });

    if (transactions.length === 0) return NextResponse.json({ points: [] });

    const first = transactions[0].date;
    const now = new Date();
    const lastDate = transactions[transactions.length - 1].date;
    const end = lastDate > now ? lastDate : now;

    const points: { year: number; month: number; net: number; balance: number }[] = [];
    let cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    let balance = 0;
    let i = 0;

    while (cursor <= end) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      let net = 0;
      while (i < transactions.length && transactions[i].date < next) {
        const amount = Number(transactions[i].amount);
        net += transactions[i].type === "INCOME" ? amount : -amount;
        i++;
      }
      balance += net;
      points.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1, net, balance });
      cursor = next;
    }

    return NextResponse.json({ points });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
