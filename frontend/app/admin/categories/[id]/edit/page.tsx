import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const initialData = {
    id: category.id,
    nameAr: category.nameAr,
    type: category.type as "INCOME" | "EXPENSE",
    icon: category.icon || "",
    color: category.color || "#6B7280",
  };

  return <CategoryForm mode="edit" initialData={initialData} />;
}
