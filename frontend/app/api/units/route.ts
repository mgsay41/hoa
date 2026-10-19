import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { unitSchema } from "@/lib/validations/unit";

/** Owner names and notes are only returned to the admin. */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = !!(await getAdminSession(request.headers));
    const units = await prisma.unit.findMany({
      orderBy: [{ floor: "asc" }, { code: "asc" }],
      include: { _count: { select: { transactions: true } } },
    });

    return NextResponse.json(
      units.map((u) => ({
        ...u,
        ownerName: isAdmin ? u.ownerName : null,
        notes: isAdmin ? u.notes : null,
      }))
    );
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const parsed = unitSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const duplicate = await prisma.unit.findUnique({ where: { code: data.code } });
    if (duplicate) {
      return NextResponse.json({ error: "رقم الوحدة مستخدم بالفعل" }, { status: 409 });
    }

    const unit = await prisma.unit.create({
      data: {
        code: data.code,
        floor: data.floor,
        ownerName: data.ownerName || null,
        monthlyFee: data.monthlyFee,
        duesStartDate: new Date(data.duesStartDate),
        isActive: data.isActive ?? true,
        notes: data.notes || null,
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "UNIT",
      entityId: unit.id,
      summary: `إضافة وحدة: ${unit.code}`,
      actorEmail: session.user.email,
    });

    return NextResponse.json(unit, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
