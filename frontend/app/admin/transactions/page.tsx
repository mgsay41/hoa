import { prisma } from "@/lib/prisma";
import { TransactionsBrowser } from "@/components/transactions-browser";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

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

  return <TransactionsBrowser categories={categories} admin />;
}
