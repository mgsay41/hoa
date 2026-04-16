import { prisma } from "@/lib/prisma";
import { TransactionsList } from "@/components/transactions-list";

export default async function TransactionsPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      nameAr: true,
      type: true,
      icon: true,
      color: true,
    },
    orderBy: { nameAr: "asc" },
  });

  return <TransactionsList categories={categories} />;
}
