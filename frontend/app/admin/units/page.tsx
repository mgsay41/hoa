import { prisma } from "@/lib/prisma";
import { UnitsManage } from "@/components/units-manage";
import { UnitsLedger } from "@/components/units-ledger";

export const dynamic = "force-dynamic";

export default async function AdminUnitsPage() {
  const units = await prisma.unit.findMany({
    orderBy: [{ floor: "asc" }, { code: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <>
      <UnitsManage
        units={units.map((u) => ({
          id: u.id,
          code: u.code,
          floor: u.floor,
          ownerName: u.ownerName,
          monthlyFee: u.monthlyFee.toString(),
          isActive: u.isActive,
          payments: u._count.transactions,
        }))}
      />
      <UnitsLedger admin />
    </>
  );
}
