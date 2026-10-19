import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/category-form";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Seeded ids contain Arabic; page params can arrive still percent-encoded
  const id = decodeURIComponent((await params).id);

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true, recurring: true } } },
  });
  if (!category) notFound();

  const initialData = {
    id: category.id,
    nameAr: category.nameAr,
    type: category.type as "INCOME" | "EXPENSE",
    icon: category.icon || "",
    color: category.color || "#6B7280",
    monthlyBudget: category.monthlyBudget ? Number(category.monthlyBudget).toString() : "",
    inUse: category._count.transactions + category._count.recurring > 0,
  };

  return <CategoryForm mode="edit" initialData={initialData} />;
}
