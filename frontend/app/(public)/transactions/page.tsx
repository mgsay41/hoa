import { prisma } from "@/lib/prisma";
import { TransactionsBrowser } from "@/components/transactions-browser";
import type { Metadata } from "next";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سجل المعاملات",
  description: "سجل كامل بجميع المعاملات المالية — إيرادات ومصروفات مع تصفية وبحث",
};

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

  return <TransactionsBrowser categories={categories} />;
}
