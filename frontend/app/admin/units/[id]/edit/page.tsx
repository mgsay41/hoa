import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UnitForm } from "@/components/unit-form";

export const dynamic = "force-dynamic";

export default async function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  // Seeded ids contain Arabic; page params can arrive still percent-encoded
  const id = decodeURIComponent((await params).id);
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) notFound();

  return (
    <UnitForm
      initialData={{
        id: unit.id,
        code: unit.code,
        floor: unit.floor,
        ownerName: unit.ownerName ?? "",
        monthlyFee: Number(unit.monthlyFee).toString(),
        duesStartDate: unit.duesStartDate.toISOString().split("T")[0],
        isActive: unit.isActive,
        notes: unit.notes ?? "",
      }}
    />
  );
}
