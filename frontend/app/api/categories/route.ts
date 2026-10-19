import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, unauthorized } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { categorySchema } from "@/lib/validations/category";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ type: "asc" }, { nameAr: "asc" }],
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request.headers);
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const category = await prisma.category.create({
      data: {
        nameAr: data.nameAr,
        type: data.type,
        icon: data.icon || null,
        color: data.color || null,
        monthlyBudget: data.type === "EXPENSE" && data.monthlyBudget ? data.monthlyBudget : null,
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "CATEGORY",
      entityId: category.id,
      summary: `إضافة فئة: ${category.nameAr}`,
      actorEmail: session.user.email,
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
