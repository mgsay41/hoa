import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transaction-form";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Seeded ids contain Arabic; page params can arrive still percent-encoded
  const id = decodeURIComponent((await params).id);

  const [transaction, categories, units] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        nameAr: true,
        type: true,
        icon: true,
      },
      orderBy: { nameAr: "asc" },
    }),
    prisma.unit.findMany({
      where: { isActive: true },
      select: { id: true, code: true, monthlyFee: true },
      orderBy: [{ floor: "asc" }, { code: "asc" }],
    }),
  ]);

  if (!transaction) notFound();

  const initialData = {
    id: transaction.id,
    type: transaction.type as "INCOME" | "EXPENSE",
    amount: transaction.amount.toString(),
    date: transaction.date.toISOString().split("T")[0],
    descriptionAr: transaction.descriptionAr,
    categoryId: transaction.categoryId,
    paymentMethod: transaction.paymentMethod,
    fund: transaction.fund,
    unitId: transaction.unitId,
    periodMonth: transaction.periodMonth,
    periodYear: transaction.periodYear,
    notes: transaction.notes,
    attachmentUrl: transaction.attachmentUrl,
    attachmentType: transaction.attachmentType,
  };

  return (
    <TransactionForm
      categories={categories}
      units={units.map((u) => ({ ...u, monthlyFee: u.monthlyFee.toString() }))}
      mode="edit"
      initialData={initialData}
    />
  );
}
