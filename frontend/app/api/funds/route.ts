import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { getFundBalances } from "@/lib/funds";
import { fundTransferSchema } from "@/lib/validations/unit";
import { formatAmount } from "@/lib/utils";

export async function GET() {
  try {
    const [balances, transfers, reserveTransactions] = await Promise.all([
      getFundBalances(),
      prisma.fundTransfer.findMany({ orderBy: { date: "desc" }, take: 50 }),
      prisma.transaction.findMany({
        where: { fund: "RESERVE" },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 50,
      }),
    ]);
    return NextResponse.json({ balances, transfers, reserveTransactions });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const parsed = fundTransferSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const balances = await getFundBalances();
    const available = data.direction === "TO_RESERVE" ? balances.operating : balances.reserve;
    if (Number(data.amount) > available) {
      return NextResponse.json(
        { error: `الرصيد المتاح للتحويل ${formatAmount(available)} ج.م فقط` },
        { status: 400 }
      );
    }

    const transfer = await prisma.fundTransfer.create({
      data: {
        direction: data.direction,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes || null,
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "FUND_TRANSFER",
      entityId: transfer.id,
      summary: `${data.direction === "TO_RESERVE" ? "تحويل إلى صندوق الطوارئ" : "سحب من صندوق الطوارئ"}: ${formatAmount(data.amount)} ج.م`,
      actorEmail: session.user.email,
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
