import { prisma } from "@/lib/prisma";
import { arabicMonths } from "@/lib/utils";

const MAX_CATCH_UP_MONTHS = 24;

function nextMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/** The month before the given date — used so a reactivated item resumes from the current month. */
export function previousMonthOf(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}

/**
 * Creates every recurring transaction that is due up to `now`, including months that were
 * missed (cron outage, item added mid-month, etc). Safe to run repeatedly: each item/month
 * pair is protected by a unique constraint and by lastGeneratedMonth/Year.
 */
export async function generateRecurring(options: { now?: Date; itemId?: string } = {}) {
  const now = options.now ?? new Date();
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth() + 1;

  const items = await prisma.recurringItem.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      ...(options.itemId ? { id: options.itemId } : {}),
    },
  });

  let generated = 0;

  for (const item of items) {
    let cursor =
      item.lastGeneratedYear && item.lastGeneratedMonth
        ? nextMonth(item.lastGeneratedYear, item.lastGeneratedMonth)
        : { year: item.startDate.getUTCFullYear(), month: item.startDate.getUTCMonth() + 1 };

    for (let i = 0; i < MAX_CATCH_UP_MONTHS; i++) {
      if (cursor.year > nowYear || (cursor.year === nowYear && cursor.month > nowMonth)) break;

      const date = new Date(Date.UTC(cursor.year, cursor.month - 1, item.dayOfMonth));
      if (date > now) break;
      if (item.endDate && date > item.endDate) break;

      if (date >= item.startDate) {
        try {
          await prisma.$transaction([
            prisma.transaction.create({
              data: {
                type: item.type,
                amount: item.amount,
                date,
                descriptionAr: `${item.nameAr} — ${arabicMonths[cursor.month - 1]} ${cursor.year}`,
                categoryId: item.categoryId,
                paymentMethod: "CASH",
                recurringItemId: item.id,
                periodMonth: cursor.month,
                periodYear: cursor.year,
              },
            }),
            prisma.recurringItem.update({
              where: { id: item.id },
              data: { lastGeneratedMonth: cursor.month, lastGeneratedYear: cursor.year },
            }),
          ]);
          generated++;
        } catch (e) {
          // P2002: this month already exists — just move the marker forward
          if ((e as { code?: string }).code !== "P2002") throw e;
          await prisma.recurringItem.update({
            where: { id: item.id },
            data: { lastGeneratedMonth: cursor.month, lastGeneratedYear: cursor.year },
          });
        }
      }

      cursor = nextMonth(cursor.year, cursor.month);
    }
  }

  return { generated, month: nowMonth, year: nowYear };
}
