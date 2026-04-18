import { prisma } from "@/lib/prisma";
import { AdminCategoriesList } from "@/components/admin-categories-list";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { nameAr: "asc" }],
    include: {
      _count: {
        select: { transactions: true, recurring: true },
      },
    },
  });

  return <AdminCategoriesList categories={categories} />;
}
