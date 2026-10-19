import { prisma } from "@/lib/prisma";

export type DuesStatus = "PAID" | "PARTIAL" | "DUE" | "LATE" | "NA";

export type LedgerUnit = {
  id: string;
  code: string;
  floor: number;
  ownerName: string | null;
  monthlyFee: number;
  months: { month: number; expected: number; paid: number; status: DuesStatus }[];
  yearPaid: number;
  yearExpected: number;
  /** Unpaid amount across all months up to now, not only the selected year */
  arrears: number;
  lateMonths: number;
};

function monthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
}

/** Per-unit dues ledger for one year: what each unit owed and paid each month. */
export async function getDuesLedger(year: number, now = new Date()) {
  const currentIdx = monthIndex(now.getUTCFullYear(), now.getUTCMonth() + 1);

  const [units, yearPayments, allPayments] = await Promise.all([
    prisma.unit.findMany({ where: { isActive: true }, orderBy: [{ floor: "asc" }, { code: "asc" }] }),
    prisma.transaction.groupBy({
      by: ["unitId", "periodMonth"],
      where: { unitId: { not: null }, type: "INCOME", periodYear: year },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["unitId"],
      where: { unitId: { not: null }, type: "INCOME" },
      _sum: { amount: true },
    }),
  ]);

  const ledger: LedgerUnit[] = units.map((unit) => {
    const fee = Number(unit.monthlyFee);
    const startIdx = monthIndex(unit.duesStartDate.getUTCFullYear(), unit.duesStartDate.getUTCMonth() + 1);

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const idx = monthIndex(year, month);
      const paid = Number(
        yearPayments.find((p) => p.unitId === unit.id && p.periodMonth === month)?._sum.amount ?? 0
      );
      if (idx < startIdx || idx > currentIdx) {
        return { month, expected: 0, paid, status: (paid > 0 ? "PAID" : "NA") as DuesStatus };
      }
      let status: DuesStatus;
      if (paid >= fee) status = "PAID";
      else if (paid > 0) status = "PARTIAL";
      else status = idx === currentIdx ? "DUE" : "LATE";
      return { month, expected: fee, paid, status };
    });

    const expectedAllTime = Math.max(0, currentIdx - startIdx + 1) * fee;
    const paidAllTime = Number(allPayments.find((p) => p.unitId === unit.id)?._sum.amount ?? 0);

    return {
      id: unit.id,
      code: unit.code,
      floor: unit.floor,
      ownerName: unit.ownerName,
      monthlyFee: fee,
      months,
      yearPaid: months.reduce((s, m) => s + m.paid, 0),
      yearExpected: months.reduce((s, m) => s + m.expected, 0),
      arrears: Math.max(0, expectedAllTime - paidAllTime),
      lateMonths: months.filter((m) => m.status === "LATE" || m.status === "PARTIAL").length,
    };
  });

  const totals = {
    expected: ledger.reduce((s, u) => s + u.yearExpected, 0),
    collected: ledger.reduce((s, u) => s + u.yearPaid, 0),
    arrears: ledger.reduce((s, u) => s + u.arrears, 0),
    unitsInArrears: ledger.filter((u) => u.arrears > 0).length,
    units: ledger.length,
  };

  return { year, units: ledger, totals };
}
