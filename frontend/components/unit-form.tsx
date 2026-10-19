"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { todayInputValue } from "@/lib/utils";

const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-muted text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";
const labelClass = "block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5";

type UnitFormData = {
  id: string;
  code: string;
  floor: number;
  ownerName: string;
  monthlyFee: string;
  duesStartDate: string;
  isActive: boolean;
  notes: string;
};

export function UnitForm({ initialData }: { initialData?: UnitFormData }) {
  const { toast } = useToast();
  const router = useRouter();
  const isEdit = !!initialData;
  const [code, setCode] = useState(initialData?.code ?? "");
  const [floor, setFloor] = useState(String(initialData?.floor ?? 1));
  const [ownerName, setOwnerName] = useState(initialData?.ownerName ?? "");
  const [monthlyFee, setMonthlyFee] = useState(initialData?.monthlyFee ?? "500");
  const [duesStartDate, setDuesStartDate] = useState(initialData?.duesStartDate ?? todayInputValue());
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        code: code.trim(),
        floor: parseInt(floor) || 0,
        ownerName: ownerName.trim() || null,
        monthlyFee,
        duesStartDate,
        isActive,
        notes: notes.trim() || null,
      };
      const res = await fetch(isEdit ? `/api/units/${initialData.id}` : "/api/units", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "حدث خطأ أثناء حفظ الوحدة", "error");
        return;
      }
      toast(isEdit ? "تم تحديث الوحدة" : "تمت إضافة الوحدة");
      router.push("/admin/units");
      router.refresh();
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">{isEdit ? `تعديل الوحدة ${initialData.code}` : "إضافة وحدة"}</h1>
        <p className="text-sm text-text-muted mt-1">بيانات المالك تظهر للإدارة فقط ولا تُعرض في الموقع العام</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className={labelClass}>رقم الوحدة</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} className={fieldClass} placeholder="مثال: 3B" required maxLength={10} />
          </label>
          <label>
            <span className={labelClass}>الدور</span>
            <input type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} className={fieldClass} required />
          </label>
        </div>

        <label>
          <span className={labelClass}>اسم المالك <span className="normal-case font-normal">(اختياري)</span></span>
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={fieldClass} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label>
            <span className={labelClass}>الاشتراك الشهري</span>
            <div className="relative">
              <input type="number" step="0.01" min="0" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={fieldClass} required />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-xs font-medium bg-surface-elevated px-1.5 py-0.5 rounded-md border border-border">ج.م</span>
            </div>
          </label>
          <label>
            <span className={labelClass}>بداية الاشتراك</span>
            <input type="date" value={duesStartDate} onChange={(e) => setDuesStartDate(e.target.value)} className={fieldClass} required />
          </label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
          <span className="text-sm text-text-secondary">وحدة نشطة (تُحتسب عليها اشتراكات)</span>
        </label>

        <label>
          <span className={labelClass}>ملاحظات <span className="normal-case font-normal">(اختياري)</span></span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${fieldClass} resize-none`} />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-primary text-on-primary hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {submitting ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الوحدة"}
          </button>
          <Link href="/admin/units" className="px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:bg-surface-elevated transition-colors">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
