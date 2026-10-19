import { prisma } from "@/lib/prisma";
import { AdminCategoriesList } from "@/components/admin-categories-list";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { nameAr: "asc" }],
    include: {
      _count: {
        select: { transactions: true, recurring: true },
      },
    },
  });

  // Decimal isn't serializable across the server → client boundary
  return (
    <AdminCategoriesList
      categories={categories.map((c) => ({
        ...c,
        monthlyBudget: c.monthlyBudget ? c.monthlyBudget.toString() : null,
      }))}
    />
  );
}
