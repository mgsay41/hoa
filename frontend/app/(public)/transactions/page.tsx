import { prisma } from "@/lib/prisma";
import { TransactionsList } from "@/components/transactions-list";
import type { Metadata } from "next";

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

  return <TransactionsList categories={categories} />;
}
