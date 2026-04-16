import { prisma } from "@/lib/prisma";
import { RecurringForm } from "@/components/recurring-form";

export default async function NewRecurringPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      nameAr: true,
      type: true,
      icon: true,
    },
    orderBy: { nameAr: "asc" },
  });

  return <RecurringForm categories={categories} />;
}
