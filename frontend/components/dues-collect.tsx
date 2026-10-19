"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/states";
import { arabicMonths, formatAmount, paymentMethodLabels, todayInputValue } from "@/lib/utils";

type Category = { id: string; nameAr: string; icon: string | null };

type LedgerUnit = {
  id: string;
  code: string;
  ownerName: string | null;
  monthlyFee: number;
  months: { month: number; paid: number; status: string }[];
};

const fieldClass =
  "w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

/** Tick the units that paid this month and record them all in one go. */
export function DuesCollect({ categories, defaultCategoryId }: { categories: Category[]; defaultCategoryId: string }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [date, setDate] = useState(todayInputValue());
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [units, setUnits] = useState<LedgerUnit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch(`/api/units/ledger?year=${year}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUnits(data.units);
      setSelected(new Set());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const rows = useMemo(
    () =>
      units.map((u) => {
        const m = u.months[month - 1];
        const remaining = Math.max(0, u.monthlyFee - (m?.paid ?? 0));
        return { ...u, paid: m?.paid ?? 0, remaining, status: m?.status ?? "NA" };
      }),
    [units, month]
  );
  const unpaid = rows.filter((r) => r.remaining > 0);
  const total = rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.remaining, 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    const ok = await confirm({
      title: `تسجيل اشتراك ${arabicMonths[month - 1]} ${year}`,
      message: `سيتم تسجيل ${selected.size} دفعة بإجمالي ${formatAmount(total)} ج.م.`,
      confirmLabel: "تسجيل",
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/units/dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodMonth: month,
          periodYear: year,
          date,
          categoryId,
          paymentMethod,
          unitIds: Array.from(selected),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "تعذر تسجيل المدفوعات", "error");
        return;
      }
      toast(`تم تسجيل ${data.created} دفعة (${formatAmount(data.total)} ج.م)`);
      setLoading(true);
      await fetchLedger();
      router.refresh();
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">تحصيل الاشتراكات</h1>
        <p className="text-sm text-text-muted mt-1">اختر الشهر ثم حدد الوحدات التي سددت — تُسجَّل كل دفعة كمعاملة إيراد مستقلة</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <label className="col-span-1">
          <span className="block text-xs text-text-muted mb-1.5">عن شهر</span>
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setSelected(new Set()); }} className={fieldClass}>
            {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="col-span-1">
          <span className="block text-xs text-text-muted mb-1.5">السنة</span>
          <input type="number" min={2000} max={2100} value={year} onChange={(e) => { setLoading(true); setYear(Number(e.target.value)); }} className={fieldClass} />
        </label>
        <label className="col-span-1">
          <span className="block text-xs text-text-muted mb-1.5">تاريخ الاستلام</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
        <label className="col-span-1">
          <span className="block text-xs text-text-muted mb-1.5">طريقة الدفع</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={fieldClass}>
            {Object.entries(paymentMethodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="block text-xs text-text-muted mb-1.5">الفئة</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClass}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nameAr}</option>)}
          </select>
        </label>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs text-text-muted">
            {loading ? "..." : `${unpaid.length} وحدة لم تسدد ${arabicMonths[month - 1]}`}
          </span>
          {unpaid.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelected(selected.size === unpaid.length ? new Set() : new Set(unpaid.map((u) => u.id)))
              }
              className="text-xs text-primary hover:underline"
            >
              {selected.size === unpaid.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-11" />)}</div>
        ) : error ? (
          <ErrorState onRetry={() => { setLoading(true); fetchLedger(); }} compact />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">لا توجد وحدات نشطة</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const done = r.remaining === 0;
              return (
                <li key={r.id}>
                  <label className={`flex items-center gap-3 px-4 py-3 ${done ? "opacity-60" : "cursor-pointer hover:bg-surface-elevated"}`}>
                    <input
                      type="checkbox"
                      disabled={done}
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span className="font-semibold text-sm text-text-primary w-12">{r.code}</span>
                    <span className="flex-1 text-xs text-text-muted truncate">{r.ownerName || ""}</span>
                    {done ? (
                      <span className="text-xs font-medium text-income">✓ مسدد</span>
                    ) : (
                      <span className="text-sm font-semibold text-text-secondary whitespace-nowrap">
                        {r.paid > 0 && <span className="text-[10px] text-warning ml-1">(متبقي)</span>}
                        {formatAmount(r.remaining)} ج.م
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="sticky bottom-20 lg:bottom-4 mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting || !categoryId}
          className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-on-primary hover:bg-primary-dark transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting
            ? "جارٍ التسجيل..."
            : selected.size > 0
              ? `تسجيل ${selected.size} دفعة — ${formatAmount(total)} ج.م`
              : "حدد الوحدات التي سددت"}
        </button>
      </div>
    </div>
  );
}
