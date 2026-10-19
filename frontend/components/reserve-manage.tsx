"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/states";
import { formatAmount, formatDate, todayInputValue } from "@/lib/utils";

type Transfer = { id: string; direction: "TO_RESERVE" | "FROM_RESERVE"; amount: string; date: string; notes: string | null };
type ReserveTx = { id: string; type: "INCOME" | "EXPENSE"; amount: string; date: string; descriptionAr: string; category: { nameAr: string; icon: string | null } };
type FundsData = {
  balances: { operating: number; reserve: number; total: number };
  transfers: Transfer[];
  reserveTransactions: ReserveTx[];
};

const fieldClass =
  "w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

export function ReserveManage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<FundsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [direction, setDirection] = useState<"TO_RESERVE" | "FROM_RESERVE">("TO_RESERVE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/funds");
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, amount, date, notes: notes || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || "تعذر تسجيل التحويل", "error");
        return;
      }
      toast("تم تسجيل التحويل");
      setAmount("");
      setNotes("");
      await fetchData();
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(t: Transfer) {
    const ok = await confirm({
      title: "حذف التحويل؟",
      message: `سيتم إلغاء تحويل ${formatAmount(t.amount)} ج.م وإعادة احتساب الأرصدة.`,
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/funds/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("تعذر حذف التحويل", "error");
      return;
    }
    toast("تم حذف التحويل");
    await fetchData();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-border rounded-2xl">
        <ErrorState onRetry={() => { setLoading(true); fetchData(); }} />
      </div>
    );
  }

  const { balances } = data;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">صندوق الطوارئ</h1>
        <p className="text-sm text-text-muted mt-0.5">
          رصيد احتياطي منفصل للإصلاحات الكبيرة والطوارئ. حوّل إليه جزءاً من الفائض، واختر «صندوق الطوارئ» عند تسجيل مصروف يُدفع منه.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4">
          <p className="text-xs text-warning mb-1">رصيد صندوق الطوارئ</p>
          <p className="text-2xl font-bold text-text-primary">{formatAmount(balances.reserve)} <span className="text-xs font-normal text-text-muted">ج.م</span></p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-text-muted mb-1">الحساب الجاري</p>
          <p className="text-2xl font-bold text-text-primary">{formatAmount(balances.operating)} <span className="text-xs font-normal text-text-muted">ج.م</span></p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-text-muted mb-1">الإجمالي</p>
          <p className="text-2xl font-bold text-primary">{formatAmount(balances.total)} <span className="text-xs font-normal text-text-muted">ج.م</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Transfer form */}
        <form onSubmit={handleTransfer} className="lg:col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 h-fit">
          <h2 className="text-sm font-semibold text-text-primary">تحويل بين الحسابين</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="اتجاه التحويل">
            {(["TO_RESERVE", "FROM_RESERVE"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={direction === d}
                onClick={() => setDirection(d)}
                className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  direction === d ? "bg-primary/10 border-primary/40 text-primary" : "bg-bg border-border text-text-muted"
                }`}
              >
                {d === "TO_RESERVE" ? "إيداع في الصندوق" : "سحب من الصندوق"}
              </button>
            ))}
          </div>
          <label>
            <span className="block text-xs text-text-muted mb-1.5">المبلغ</span>
            <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldClass} required />
            <span className="block text-[11px] text-text-muted mt-1">
              المتاح: {formatAmount(direction === "TO_RESERVE" ? balances.operating : balances.reserve)} ج.م
            </span>
          </label>
          <label>
            <span className="block text-xs text-text-muted mb-1.5">التاريخ</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
          </label>
          <label>
            <span className="block text-xs text-text-muted mb-1.5">ملاحظات</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} placeholder="مثال: تجنيب شهري" />
          </label>
          <button
            type="submit"
            disabled={submitting || !amount}
            className="py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {submitting ? "جارٍ التسجيل..." : "تسجيل التحويل"}
          </button>
        </form>

        <div className="lg:col-span-3 space-y-5">
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <h2 className="text-sm font-semibold text-text-primary px-4 py-3.5 border-b border-border">سجل التحويلات</h2>
            {data.transfers.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">لا توجد تحويلات بعد</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.transfers.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.direction === "TO_RESERVE" ? "bg-warning-bg text-warning" : "bg-surface-elevated text-text-secondary"}`}>
                      {t.direction === "TO_RESERVE" ? "إيداع" : "سحب"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{formatAmount(t.amount)} ج.م</p>
                      <p className="text-[11px] text-text-muted truncate">{formatDate(t.date)}{t.notes ? ` — ${t.notes}` : ""}</p>
                    </div>
                    <button onClick={() => handleDelete(t)} className="text-xs text-expense hover:underline">حذف</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">معاملات الصندوق</h2>
              <Link href="/admin/transactions/new" className="text-xs text-primary hover:underline">+ مصروف من الصندوق</Link>
            </div>
            {data.reserveTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">لا توجد معاملات على الصندوق</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.reserveTransactions.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{tx.descriptionAr}</p>
                      <p className="text-[11px] text-text-muted">{formatDate(tx.date)} • {tx.category.icon} {tx.category.nameAr}</p>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
                      {tx.type === "INCOME" ? "+" : "−"}{formatAmount(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
