import { prisma } from "@/lib/prisma";
import { AdminTransactionsList } from "@/components/admin-transactions-list";

export default async function AdminTransactionsPage() {
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

  return <AdminTransactionsList categories={categories} />;
}
