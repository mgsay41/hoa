import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/app/generated/prisma/enums";

/** Public, read-only change history. The actor's email is never exposed. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = 25;
    const action = searchParams.get("action");
    const where =
      action === "CREATE" || action === "UPDATE" || action === "DELETE" ? { action: action as AuditAction } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, action: true, entity: true, entityId: true, summary: true, changes: true, createdAt: true },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
