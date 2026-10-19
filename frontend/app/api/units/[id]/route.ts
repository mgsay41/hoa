import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { diff, logAudit } from "@/lib/audit";
import { unitSchema } from "@/lib/validations/unit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
    }

    const parsed = unitSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const input = parsed.data;

    if (input.code && input.code !== existing.code) {
      const duplicate = await prisma.unit.findUnique({ where: { code: input.code } });
      if (duplicate) {
        return NextResponse.json({ error: "رقم الوحدة مستخدم بالفعل" }, { status: 409 });
      }
    }

    const data: Prisma.UnitUpdateInput = {};
    if (input.code !== undefined) data.code = input.code;
    if (input.floor !== undefined) data.floor = input.floor;
    if (input.ownerName !== undefined) data.ownerName = input.ownerName || null;
    if (input.monthlyFee !== undefined) data.monthlyFee = input.monthlyFee;
    if (input.duesStartDate !== undefined) data.duesStartDate = new Date(input.duesStartDate);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.notes !== undefined) data.notes = input.notes || null;

    const updated = await prisma.unit.update({ where: { id }, data });

    const changes = diff(existing, updated);
    if (Object.keys(changes).length > 0) {
      await logAudit({
        action: "UPDATE",
        entity: "UNIT",
        entityId: id,
        summary: `تعديل وحدة: ${updated.code}`,
        // Owner details stay out of the public log
        changes: Object.fromEntries(
          Object.entries(changes).filter(([k]) => k !== "ownerName" && k !== "notes")
        ),
        actorEmail: session.user.email,
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const { id } = await params;
    const existing = await prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
    }
    if (existing._count.transactions > 0) {
      return NextResponse.json(
        { error: "الوحدة لها مدفوعات مسجلة — يمكنك تعطيلها بدلاً من الحذف" },
        { status: 409 }
      );
    }

    await prisma.unit.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      entity: "UNIT",
      entityId: id,
      summary: `حذف وحدة: ${existing.code}`,
      actorEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
