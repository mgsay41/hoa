import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transaction-form";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, nameAr: true, type: true, icon: true },
      orderBy: { nameAr: "asc" },
    }),
    prisma.unit.findMany({
      where: { isActive: true },
      select: { id: true, code: true, monthlyFee: true },
      orderBy: [{ floor: "asc" }, { code: "asc" }],
    }),
  ]);

  return (
    <TransactionForm
      categories={categories}
      units={units.map((u) => ({ ...u, monthlyFee: u.monthlyFee.toString() }))}
    />
  );
}
