import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      nameAr: true,
      type: true,
      icon: true,
    },
    orderBy: { nameAr: "asc" },
  });

  return <TransactionForm categories={categories} />;
}
