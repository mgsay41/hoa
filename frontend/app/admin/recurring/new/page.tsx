import { prisma } from "@/lib/prisma";
import { RecurringForm } from "@/components/recurring-form";

// Reads categories from the database — must not be frozen at build time
export const dynamic = "force-dynamic";

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
