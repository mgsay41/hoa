import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecurringForm } from "@/components/recurring-form";

export const dynamic = "force-dynamic";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Seeded ids contain Arabic; page params can arrive still percent-encoded
  const id = decodeURIComponent((await params).id);

  const [item, categories] = await Promise.all([
    prisma.recurringItem.findUnique({ where: { id } }),
    prisma.category.findMany({
      select: { id: true, nameAr: true, type: true, icon: true },
      orderBy: { nameAr: "asc" },
    }),
  ]);

  if (!item) notFound();

  return (
    <RecurringForm
      categories={categories}
      initialData={{
        id: item.id,
        nameAr: item.nameAr,
        type: item.type,
        amount: Number(item.amount).toString(),
        categoryId: item.categoryId,
        dayOfMonth: item.dayOfMonth,
        startDate: item.startDate.toISOString().split("T")[0],
        endDate: item.endDate ? item.endDate.toISOString().split("T")[0] : "",
        notes: item.notes ?? "",
      }}
    />
  );
}
