import { prisma } from "@/lib/prisma";
import { DuesCollect } from "@/components/dues-collect";

export const dynamic = "force-dynamic";

export default async function CollectDuesPage() {
  const categories = await prisma.category.findMany({
    where: { type: "INCOME" },
    select: { id: true, nameAr: true, icon: true },
    orderBy: { nameAr: "asc" },
  });

  // Default to the subscriptions category when it exists
  const defaultCategory = categories.find((c) => c.nameAr.includes("اشتراك")) ?? categories[0];

  return <DuesCollect categories={categories} defaultCategoryId={defaultCategory?.id ?? ""} />;
}
