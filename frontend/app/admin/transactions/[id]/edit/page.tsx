import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [transaction, categories] = await Promise.all([
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
    notes: transaction.notes,
    attachmentUrl: transaction.attachmentUrl,
    attachmentType: transaction.attachmentType,
  };

  return (
    <TransactionForm
      categories={categories}
      mode="edit"
      initialData={initialData}
    />
  );
}
