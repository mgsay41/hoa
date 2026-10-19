import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/app/generated/prisma/enums";

export type AuditEntity = "TRANSACTION" | "CATEGORY" | "RECURRING" | "UNIT" | "FUND_TRANSFER";

export const auditEntityLabels: Record<AuditEntity, string> = {
  TRANSACTION: "معاملة",
  CATEGORY: "فئة",
  RECURRING: "بند متكرر",
  UNIT: "وحدة",
  FUND_TRANSFER: "تحويل صندوق",
};

/** Plain JSON copy of a record (Decimal/Date → string) so it can be stored in AuditLog.changes. */
export function snapshot(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}

/** Lists the fields that changed between two snapshots: { field: { from, to } }. */
export function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const a = snapshot(before);
  const b = snapshot(after);
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(b)) {
    if (key === "createdAt" || key === "category" || key === "unit") continue;
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      changes[key] = { from: a[key] ?? null, to: b[key] ?? null };
    }
  }
  return changes;
}

export async function logAudit(entry: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  summary: string;
  changes?: unknown;
  actorEmail?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        summary: entry.summary,
        changes: entry.changes == null ? undefined : snapshot(entry.changes),
        actorEmail: entry.actorEmail ?? null,
      },
    });
  } catch {
    // Auditing must never block the main operation
  }
}
