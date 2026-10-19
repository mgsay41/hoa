import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getTransactionsQuerySchema } from "@/lib/validations/transaction";

/** Parses list/export query params into a Prisma where + orderBy. Returns null if invalid. */
export function parseTransactionFilters(searchParams: URLSearchParams) {
  const parsed = getTransactionsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) return null;

  const { month, year, type, categoryId, unitId, fund, q, sort, page = "1", limit = "20" } = parsed.data;
  const where: Prisma.TransactionWhereInput = {};

  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (year) {
    const y = parseInt(year);
    where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
  }

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (unitId) where.unitId = unitId;
  if (fund) where.fund = fund;
  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { descriptionAr: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
      { unit: { code: { contains: term, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput[] =
    sort === "date_asc"
      ? [{ date: "asc" }, { createdAt: "asc" }]
      : sort === "amount_desc"
        ? [{ amount: "desc" }]
        : sort === "amount_asc"
          ? [{ amount: "asc" }]
          : [{ date: "desc" }, { createdAt: "desc" }];

  return {
    where,
    orderBy,
    page: Math.max(1, parseInt(page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
  };
}

/** Ensures the category exists and matches the transaction type. Returns an error message or null. */
export async function checkCategoryType(categoryId: string, type: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return "الفئة غير موجودة";
  if (category.type !== type) return "نوع الفئة لا يطابق نوع المعاملة";
  return null;
}
