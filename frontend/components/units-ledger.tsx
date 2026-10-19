"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { arabicMonths, formatAmount } from "@/lib/utils";
import { useYears } from "@/lib/use-years";
import { EmptyState, ErrorState } from "@/components/states";

type DuesStatus = "PAID" | "PARTIAL" | "DUE" | "LATE" | "NA";

type LedgerUnit = {
  id: string;
  code: string;
  floor: number;
  ownerName: string | null;
  monthlyFee: number;
  months: { month: number; expected: number; paid: number; status: DuesStatus }[];
  yearPaid: number;
  yearExpected: number;
  arrears: number;
  lateMonths: number;
};

type Ledger = {
  year: number;
  units: LedgerUnit[];
  totals: { expected: number; collected: number; arrears: number; unitsInArrears: number; units: number };
};

const STATUS_STYLE: Record<DuesStatus, { cell: string; label: string; symbol: string }> = {
  PAID: { cell: "bg-income-bg text-income border-income/30", label: "مسدد", symbol: "✓" },
  PARTIAL: { cell: "bg-warning-bg text-warning border-warning/30", label: "سداد جزئي", symbol: "½" },
  DUE: { cell: "bg-primary/10 text-primary border-primary/30", label: "مستحق هذا الشهر", symbol: "•" },
  LATE: { cell: "bg-expense-bg text-expense border-expense/30", label: "متأخر", symbol: "✕" },
  NA: { cell: "bg-transparent text-text-muted border-border border-dashed", label: "غير مستحق", symbol: "" },
};

export function UnitsLedger({ admin = false }: { admin?: boolean }) {
  const years = useYears();
  const [year, setYear] = useState(new Date().getFullYear());
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "late">("all");

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch(`/api/units/ledger?year=${year}`);
      if (!res.ok) throw new Error();
      setLedger(await res.json());
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

  const units = ledger?.units.filter((u) => filter === "all" || u.arrears > 0) ?? [];
  const pct = ledger && ledger.totals.expected > 0 ? (ledger.totals.collected / ledger.totals.expected) * 100 : 0;

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{admin ? "الوحدات والاشتراكات" : "اشتراكات الوحدات"}</h1>
          <p className="text-sm text-text-muted mt-0.5">حالة سداد الاشتراك الشهري لكل وحدة</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-surface rounded-xl p-1 border border-border" role="tablist" aria-label="عرض">
            {(["all", "late"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? "bg-primary text-on-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {f === "all" ? "كل الوحدات" : "المتأخرة فقط"}
              </button>
            ))}
          </div>
          <select
            value={year}
            onChange={(e) => {
              setLoading(true);
              setYear(Number(e.target.value));
            }}
            aria-label="السنة"
            className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary/40 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      ) : error || !ledger ? (
        <div className="bg-surface border border-border rounded-2xl">
          <ErrorState onRetry={() => { setLoading(true); fetchLedger(); }} />
        </div>
      ) : ledger.units.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl">
          <EmptyState
            title="لا توجد وحدات مسجلة"
            action={admin ? (
              <Link href="/admin/units/new" className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold">إضافة وحدة</Link>
            ) : undefined}
          />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Stat label={`المستحق ${ledger.year}`} value={`${formatAmount(ledger.totals.expected)} ج.م`} />
            <Stat label="المحصّل" value={`${formatAmount(ledger.totals.collected)} ج.م`} tone="income" />
            <Stat label="نسبة التحصيل" value={`${pct.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪`} tone="primary" />
            <Stat
              label="إجمالي المتأخرات"
              value={`${formatAmount(ledger.totals.arrears)} ج.م`}
              hint={`${ledger.totals.unitsInArrears} من ${ledger.totals.units} وحدة`}
              tone={ledger.totals.arrears > 0 ? "expense" : "income"}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-[11px] text-text-muted">
            {(["PAID", "PARTIAL", "LATE", "DUE", "NA"] as DuesStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold ${STATUS_STYLE[s].cell}`}>
                  {STATUS_STYLE[s].symbol}
                </span>
                {STATUS_STYLE[s].label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated">
                    <th scope="col" className="sticky right-0 bg-surface-elevated text-right px-3 py-2.5 font-semibold text-text-secondary">الوحدة</th>
                    {arabicMonths.map((m) => (
                      <th key={m} scope="col" className="px-1 py-2.5 font-medium text-text-muted text-center">{m.slice(0, 3)}</th>
                    ))}
                    <th scope="col" className="px-3 py-2.5 font-semibold text-text-secondary text-left">المتأخرات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-elevated/60">
                      <th scope="row" className="sticky right-0 bg-surface text-right px-3 py-2 font-medium">
                        <span className="text-text-primary">{u.code}</span>
                        {admin && u.ownerName && <span className="block text-[10px] text-text-muted font-normal truncate max-w-[110px]">{u.ownerName}</span>}
                      </th>
                      {u.months.map((m) => {
                        const st = STATUS_STYLE[m.status];
                        return (
                          <td key={m.month} className="px-1 py-2 text-center">
                            <span
                              className={`mx-auto w-7 h-7 rounded-md border flex items-center justify-center font-bold ${st.cell}`}
                              title={`${arabicMonths[m.month - 1]}: ${st.label}${m.paid > 0 ? ` — ${formatAmount(m.paid)} ج.م` : ""}`}
                              aria-label={`${arabicMonths[m.month - 1]}: ${st.label}`}
                            >
                              {st.symbol}
                            </span>
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${u.arrears > 0 ? "text-expense" : "text-income"}`}>
                        {u.arrears > 0 ? `${formatAmount(u.arrears)} ج.م` : "لا يوجد"}
                      </td>
                    </tr>
                  ))}
                  {units.length === 0 && (
                    <tr>
                      <td colSpan={14} className="py-10 text-center text-text-muted">لا توجد وحدات متأخرة 🎉</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {!admin && (
            <p className="text-[11px] text-text-muted mt-3">
              تُعرض أرقام الوحدات فقط حفاظاً على خصوصية الملاك.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "income" | "expense" | "primary";
}) {
  const color =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : tone === "primary" ? "text-primary" : "text-text-primary";
  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      <p className={`text-base sm:text-lg font-bold ${color}`}>{value}</p>
      {hint && <p className="text-[10px] text-text-muted mt-0.5">{hint}</p>}
    </div>
  );
}
