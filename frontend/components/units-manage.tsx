"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatAmount } from "@/lib/utils";

export type ManagedUnit = {
  id: string;
  code: string;
  floor: number;
  ownerName: string | null;
  monthlyFee: string;
  isActive: boolean;
  payments: number;
};

export function UnitsManage({ units }: { units: ManagedUnit[] }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(unit: ManagedUnit) {
    const ok = await confirm({
      title: `حذف الوحدة ${unit.code}؟`,
      message: "يمكن حذف الوحدات التي ليس لها مدفوعات مسجلة فقط.",
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    setBusyId(unit.id);
    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "تعذر حذف الوحدة", "error");
        return;
      }
      toast("تم حذف الوحدة");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-8">
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">بيانات الوحدات</h2>
          <p className="text-xs text-text-muted mt-0.5">{units.length} وحدة — {units.filter((u) => u.isActive).length} نشطة</p>
        </div>
        <Link
          href="/admin/units/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-dark transition-colors"
        >
          + وحدة جديدة
        </Link>
      </div>
      {units.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">لا توجد وحدات بعد</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[460px]">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="text-right px-4 py-2.5 font-medium">الوحدة</th>
                <th className="text-right px-3 py-2.5 font-medium">المالك</th>
                <th className="text-left px-3 py-2.5 font-medium">الاشتراك</th>
                <th className="px-3 py-2.5"><span className="sr-only">إجراءات</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {units.map((u) => (
                <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-text-primary">{u.code}</span>
                    <span className="text-xs text-text-muted mr-2">الدور {u.floor}</span>
                    {!u.isActive && <span className="text-[10px] text-text-muted mr-1">(معطلة)</span>}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary">{u.ownerName || "—"}</td>
                  <td className="px-3 py-2.5 text-left text-text-primary whitespace-nowrap">{formatAmount(u.monthlyFee)} ج.م</td>
                  <td className="px-3 py-2.5 text-left whitespace-nowrap">
                    <Link href={`/admin/units/${u.id}/edit`} className="text-xs text-primary hover:underline ml-3">تعديل</Link>
                    {u.payments === 0 && (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={busyId === u.id}
                        className="text-xs text-expense hover:underline disabled:opacity-50"
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
