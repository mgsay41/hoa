import { prisma } from "@/lib/prisma";

/**
 * Splits the overall balance into the operating account and the reserve (emergency) fund.
 * Transfers move money between the two without changing the total.
 */
export async function getFundBalances() {
  const [byFund, transfers] = await Promise.all([
    prisma.transaction.groupBy({ by: ["fund", "type"], _sum: { amount: true } }),
    prisma.fundTransfer.groupBy({ by: ["direction"], _sum: { amount: true } }),
  ]);

  const sum = (fund: string, type: string) =>
    Number(byFund.find((r) => r.fund === fund && r.type === type)?._sum.amount ?? 0);
  const moved = (direction: string) =>
    Number(transfers.find((r) => r.direction === direction)?._sum.amount ?? 0);

  const toReserve = moved("TO_RESERVE");
  const fromReserve = moved("FROM_RESERVE");
  const operating = sum("OPERATING", "INCOME") - sum("OPERATING", "EXPENSE") - toReserve + fromReserve;
  const reserve = sum("RESERVE", "INCOME") - sum("RESERVE", "EXPENSE") + toReserve - fromReserve;

  return { operating, reserve, total: operating + reserve };
}
