import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { checkCategoryType } from "@/lib/transaction-filters";
import { collectDuesSchema } from "@/lib/validations/unit";
import { arabicMonths, formatAmount } from "@/lib/utils";

/** Records one month's dues for several units at once — one income transaction per unit. */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const parsed = collectDuesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const categoryError = await checkCategoryType(data.categoryId, "INCOME");
    if (categoryError) {
      return NextResponse.json({ error: categoryError }, { status: 400 });
    }

    const [units, alreadyPaid] = await Promise.all([
      prisma.unit.findMany({ where: { id: { in: data.unitIds }, isActive: true } }),
      prisma.transaction.groupBy({
        by: ["unitId"],
        where: {
          unitId: { in: data.unitIds },
          type: "INCOME",
          periodMonth: data.periodMonth,
          periodYear: data.periodYear,
        },
        _sum: { amount: true },
      }),
    ]);

    const period = `${arabicMonths[data.periodMonth - 1]} ${data.periodYear}`;
    const date = new Date(data.date);

    // Only charge what is still outstanding for the month
    const rows = units
      .map((unit) => {
        const paid = Number(alreadyPaid.find((p) => p.unitId === unit.id)?._sum.amount ?? 0);
        const remaining = Number(unit.monthlyFee) - paid;
        return { unit, remaining };
      })
      .filter((r) => r.remaining > 0);

    if (rows.length === 0) {
      return NextResponse.json({ error: "الوحدات المختارة مسددة بالفعل لهذا الشهر" }, { status: 409 });
    }

    await prisma.transaction.createMany({
      data: rows.map(({ unit, remaining }) => ({
        type: "INCOME" as const,
        amount: remaining.toFixed(2),
        date,
        descriptionAr: `اشتراك شهري — وحدة ${unit.code} — ${period}`,
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod,
        unitId: unit.id,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
      })),
    });

    const total = rows.reduce((s, r) => s + r.remaining, 0);
    await logAudit({
      action: "CREATE",
      entity: "TRANSACTION",
      entityId: `dues-${data.periodYear}-${data.periodMonth}`,
      summary: `تسجيل اشتراكات ${period} لعدد ${rows.length} وحدة (${formatAmount(total)} ج.م): ${rows.map((r) => r.unit.code).join("، ")}`,
      actorEmail: session.user.email,
    });

    return NextResponse.json({ created: rows.length, total }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
